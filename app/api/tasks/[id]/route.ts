import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const taskId = params.id;
    const body = await req.json();
    const { status, title, due_at } = body;

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (title) updates.title = title.trim();
    if (due_at !== undefined) updates.due_at = due_at ? new Date(due_at).toISOString() : null;

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('business_id', auth.businessId)
      .eq('id', taskId)
      .select('*, customers(id, name)')
      .single();

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: `update_task_${status || 'edit'}`,
      entityType: 'task',
      entityId: taskId,
      metadata: updates,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
