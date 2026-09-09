import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { runAgent } from '@/agents/run-agent';

export async function POST(req: NextRequest) {
  try {
    const { auth, error: authError } = await getAuthContext();
    if (authError || !auth) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, conversation_id } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const result = await runAgent({
      businessId: auth.businessId,
      userId: auth.userId,
      conversationId: conversation_id,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      conversation_id: result.conversationId,
      reply: result.reply,
      tool_calls: result.toolCalls,
      needs_confirmation: result.needsConfirmation,
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error in AI assistant' },
      { status: 500 }
    );
  }
}
