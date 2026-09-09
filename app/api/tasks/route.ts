import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('tasks')
      .select('*, customers(id, name, phone)')
      .eq('business_id', auth.businessId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tasks, error: dbErr } = await query;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ success: true, tasks: tasks || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, due_at, customer_id } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const { data: task, error: insertErr } = await supabaseAdmin
      .from('tasks')
      .insert({
        business_id: auth.businessId,
        title: title.trim(),
        due_at: due_at ? new Date(due_at).toISOString() : null,
        related_customer_id: customer_id || null,
        status: 'pending',
        created_by: auth.userId || null,
      })
      .select('*, customers(id, name)')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: 'create_task_ui',
      entityType: 'task',
      entityId: task.id,
      metadata: { title },
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
