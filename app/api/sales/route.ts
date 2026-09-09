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
      .from('sales')
      .select('*, customers(id, name, phone), sale_items(*)')
      .eq('business_id', auth.businessId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sales, error: dbErr } = await query;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ success: true, sales: sales || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { customer_id, items, amount, status = 'completed' } = body;

    const saleAmount = Number(amount);
    if (isNaN(saleAmount) || saleAmount <= 0) {
      return NextResponse.json({ error: 'Valid positive amount in INR is required' }, { status: 400 });
    }

    // Customer check
    let customerName = 'Guest';
    if (customer_id) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('name, total_spent')
        .eq('business_id', auth.businessId)
        .eq('id', customer_id)
        .single();

      if (customer) {
        customerName = customer.name;
        // Update customer total_spent & last_visit_at
        const newTotal = (Number(customer.total_spent) || 0) + saleAmount;
        await supabaseAdmin
          .from('customers')
          .update({
            total_spent: newTotal,
            last_visit_at: new Date().toISOString(),
          })
          .eq('id', customer_id);
      }
    }

    // Insert sale
    const { data: sale, error: sErr } = await supabaseAdmin
      .from('sales')
      .insert({
        business_id: auth.businessId,
        customer_id: customer_id || null,
        total_amount: saleAmount,
        status,
        created_by: auth.userId || null,
      })
      .select()
      .single();

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    // Insert items if provided
    if (Array.isArray(items) && items.length > 0) {
      const saleItems = items.map((it: any) => ({
        sale_id: sale.id,
        name: it.name || 'Service/Item',
        price: Number(it.price) || saleAmount,
        quantity: Number(it.quantity) || 1,
      }));
      await supabaseAdmin.from('sale_items').insert(saleItems);
    }

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: 'create_sale_ui',
      entityType: 'sale',
      entityId: sale.id,
      metadata: { customerName, amount: saleAmount, status },
    });

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
