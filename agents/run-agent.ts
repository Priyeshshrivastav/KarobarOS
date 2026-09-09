import { groq, DEFAULT_GROQ_MODEL } from '@/lib/groq/client';
import { tools, CONFIRMATION_REQUIRED_TOOLS } from './tool-definitions';
import { buildSystemPrompt } from './system-prompt';
import { executeTool } from '@/tools';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizeUserId } from '@/lib/auth';

export interface AgentRunParams {
  businessId: string;
  userId?: string;
  conversationId?: string;
  message: string;
}

export interface AgentRunResult {
  conversationId: string;
  reply: string;
  toolCalls: Array<{
    name: string;
    input: any;
    output: any;
  }>;
  needsConfirmation?: {
    aiActionId: string;
    prompt: string;
    actionDetails: any;
  } | null;
}

const FALLBACK_MODELS = [
  DEFAULT_GROQ_MODEL,
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
];

// Helper to call Groq with automatic model fallback
async function createChatCompletionWithFallback(params: any) {
  let lastError: any = null;
  // Deduplicate candidate models
  const uniqueModels = Array.from(new Set([params.model, ...FALLBACK_MODELS].filter(Boolean)));

  for (const model of uniqueModels) {
    try {
      const result = await groq.chat.completions.create({
        ...params,
        model,
      });
      return { result, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed with:`, err.message || err);
      // If 404 / model_not_found / invalid_request_error, continue to next model
      if (err?.status === 404 || err?.code === 'model_not_found' || err?.message?.includes('does not exist')) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function runAgent({
  businessId,
  userId,
  conversationId: initialConvId,
  message,
}: AgentRunParams): Promise<AgentRunResult> {
  const validUserId = sanitizeUserId(userId);

  // 1. Fetch fresh business memory
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  const businessName = business?.name || 'My Karobar';
  const systemPrompt = buildSystemPrompt({
    businessName,
    businessCategory: business?.category,
    city: business?.city,
    workingHours: business?.working_hours,
    currency: business?.currency || 'INR',
  });

  // 2. Resolve or create conversation
  let convId = initialConvId;
  if (!convId) {
    const { data: newConv } = await supabaseAdmin
      .from('conversations')
      .insert({
        business_id: businessId,
        user_id: validUserId,
        title: message.slice(0, 40),
      })
      .select()
      .single();
    convId = newConv?.id;
  }

  // 3. Save incoming user message
  if (convId) {
    await supabaseAdmin.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: message,
    });
  }

  // 4. Fetch recent conversation history (last 10 messages)
  const { data: history } = convId
    ? await supabaseAdmin
        .from('messages')
        .select('role, content, tool_calls')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(10)
    : { data: [] };

  // Format messages for Groq
  const groqMessages: any[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of (history || [])) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      groqMessages.push({
        role: msg.role,
        content: msg.content || '',
      });
    }
  }

  // 5. Call Groq with tool definitions & automatic fallback
  const { result: completion, modelUsed } = await createChatCompletionWithFallback({
    model: DEFAULT_GROQ_MODEL,
    messages: groqMessages,
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.2,
    max_tokens: 1024,
  });

  const responseMessage = completion.choices[0]?.message;
  if (!responseMessage) {
    return {
      conversationId: convId || '',
      reply: 'Maaf kijiye, abhi response generate nahi ho paya. Kripya dubara koshish karein.',
      toolCalls: [],
    };
  }

  const toolCallsMade: Array<{ name: string; input: any; output: any }> = [];
  let stagedConfirmation: AgentRunResult['needsConfirmation'] = null;

  // 6. Handle tool calls if any
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    const toolCallOutputs: any[] = [];

    for (const tc of responseMessage.tool_calls) {
      const toolName = tc.function.name;
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {
        parsedArgs = {};
      }

      // Execute tool
      const toolResult = await executeTool(toolName, parsedArgs, {
        businessId,
        userId: validUserId || undefined,
        conversationId: convId,
      });

      toolCallsMade.push({
        name: toolName,
        input: parsedArgs,
        output: toolResult,
      });

      // Log AI action to database
      if (!toolResult.needs_confirmation && convId) {
        await supabaseAdmin.from('ai_actions').insert({
          business_id: businessId,
          conversation_id: convId,
          tool_name: toolName,
          input: parsedArgs,
          output: toolResult,
          status: toolResult.success ? 'success' : 'failed',
          requires_confirmation: false,
        });
      }

      if (toolResult.needs_confirmation) {
        stagedConfirmation = {
          aiActionId: toolResult.ai_action_id,
          prompt: toolResult.prompt,
          actionDetails: toolResult.action_details,
        };
      }

      toolCallOutputs.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolResult),
      });
    }

    // 7. Feed tool outputs back to Groq for final natural reply
    const assistantHistoryMessage: any = {
      role: 'assistant',
      content: responseMessage.content || null,
      tool_calls: responseMessage.tool_calls,
    };

    const followUpMessages = [
      ...groqMessages,
      assistantHistoryMessage,
      ...toolCallOutputs,
    ];

    const { result: followUpCompletion } = await createChatCompletionWithFallback({
      model: modelUsed,
      messages: followUpMessages,
      temperature: 0.3,
      max_tokens: 800,
    });

    const finalReply = followUpCompletion.choices[0]?.message?.content || 'Kaam ho gaya!';

    // Save assistant reply to messages table
    if (convId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: finalReply,
        tool_calls: toolCallsMade,
      });
    }

    return {
      conversationId: convId || '',
      reply: finalReply,
      toolCalls: toolCallsMade,
      needsConfirmation: stagedConfirmation,
    };
  }

  // No tool calls - direct natural reply
  const finalReply = responseMessage.content || '';
  if (convId) {
    await supabaseAdmin.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: finalReply,
    });
  }

  return {
    conversationId: convId || '',
    reply: finalReply,
    toolCalls: [],
  };
}
