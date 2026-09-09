import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizeIndianPhone } from '@/tools';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();

    let query = supabaseAdmin
      .from('customers')
      .select('*')
      .eq('business_id', auth.businessId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: customers, error: dbErr } = await query;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ success: true, customers: customers || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, tags } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const phoneValidation = sanitizeIndianPhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }

    // Duplicate check
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone')
      .eq('business_id', auth.businessId)
      .eq('phone', phoneValidation.formatted)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Customer with phone ${phoneValidation.formatted} already exists (${existing.name}).` },
        { status: 409 }
      );
    }

    const { data: newCustomer, error: insertErr } = await supabaseAdmin
      .from('customers')
      .insert({
        business_id: auth.businessId,
        name: name.trim(),
        phone: phoneValidation.formatted,
        email: email?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        total_spent: 0,
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: 'create_customer_ui',
      entityType: 'customer',
      entityId: newCustomer.id,
      metadata: { name: newCustomer.name, phone: newCustomer.phone },
    });

    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
