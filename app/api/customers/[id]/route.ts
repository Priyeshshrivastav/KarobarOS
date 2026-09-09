import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizeIndianPhone } from '@/tools';
import { logAudit } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const customerId = params.id;
    const { data: customer, error: cErr } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('business_id', auth.businessId)
      .eq('id', customerId)
      .single();

    if (cErr || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { data: sales } = await supabaseAdmin
      .from('sales')
      .select('*, sale_items(*)')
      .eq('business_id', auth.businessId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    const { data: notes } = await supabaseAdmin
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      customer,
      sales: sales || [],
      notes: notes || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const customerId = params.id;
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.name) updateData.name = body.name.trim();
    if (body.phone) {
      const pVal = sanitizeIndianPhone(body.phone);
      if (!pVal.valid) return NextResponse.json({ error: pVal.error }, { status: 400 });
      updateData.phone = pVal.formatted;
    }
    if (body.email !== undefined) updateData.email = body.email ? body.email.trim() : null;
    if (Array.isArray(body.tags)) updateData.tags = body.tags;

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('business_id', auth.businessId)
      .eq('id', customerId)
      .select()
      .single();

    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: 'update_customer_ui',
      entityType: 'customer',
      entityId: customerId,
      metadata: updateData,
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
