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

    const appointmentId = params.id;
    const body = await req.json();
    const { status, title, starts_at } = body;

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (title) updates.title = title.trim();
    if (starts_at) updates.starts_at = new Date(starts_at).toISOString();

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('business_id', auth.businessId)
      .eq('id', appointmentId)
      .select('*, customers(name, phone)')
      .single();

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: `update_appointment_status_${status || 'edit'}`,
      entityType: 'appointment',
      entityId: appointmentId,
      metadata: updates,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
