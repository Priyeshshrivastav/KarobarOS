import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { executeTool } from '@/tools';

export async function POST(req: NextRequest) {
  try {
    const { auth, error: authError } = await getAuthContext();
    if (authError || !auth) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { ai_action_id } = await req.json();
    if (!ai_action_id) {
      return NextResponse.json({ error: 'ai_action_id is required' }, { status: 400 });
    }

    // Retrieve pending action
    const { data: action, error: aErr } = await supabaseAdmin
      .from('ai_actions')
      .select('*')
      .eq('id', ai_action_id)
      .eq('business_id', auth.businessId)
      .eq('status', 'needs_confirmation')
      .single();

    if (aErr || !action) {
      return NextResponse.json(
        { error: 'Pending action not found or already executed' },
        { status: 404 }
      );
    }

    // Execute with confirmed = true
    const executionArgs = { ...action.input, confirmed: true };
    const result = await executeTool(action.tool_name, executionArgs, {
      businessId: auth.businessId,
      userId: auth.userId,
      conversationId: action.conversation_id,
    });

    // Update action status in DB
    await supabaseAdmin
      .from('ai_actions')
      .update({
        status: result.success ? 'success' : 'failed',
        output: result,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', ai_action_id);

    return NextResponse.json({
      success: true,
      message: 'Action confirmed and executed successfully',
      result,
    });
  } catch (err: any) {
    console.error('Confirmation Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error executing confirmed action' },
      { status: 500 }
    );
  }
}
