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
    const filter = searchParams.get('filter') || 'all';

    let query = supabaseAdmin
      .from('appointments')
      .select('*, customers(id, name, phone)')
      .eq('business_id', auth.businessId)
      .order('starts_at', { ascending: true });

    const now = new Date();
    if (filter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      query = query.gte('starts_at', start).lte('starts_at', end);
    } else if (filter === 'upcoming') {
      query = query.gte('starts_at', new Date().toISOString());
    }

    const { data: appointments, error: dbErr } = await query;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ success: true, appointments: appointments || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, error } = await getAuthContext();
    if (error || !auth) return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { customer_id, title, starts_at, ends_at } = body;

    if (!customer_id || !title || !starts_at) {
      return NextResponse.json({ error: 'Customer, title, and start time are required' }, { status: 400 });
    }

    const start = new Date(starts_at);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date/time' }, { status: 400 });
    }

    // Slot conflict check (+/- 30 min)
    const lowerWindow = new Date(start.getTime() - 29 * 60 * 1000).toISOString();
    const upperWindow = new Date(start.getTime() + 29 * 60 * 1000).toISOString();

    const { data: conflicts } = await supabaseAdmin
      .from('appointments')
      .select('id, title, starts_at')
      .eq('business_id', auth.businessId)
      .eq('status', 'scheduled')
      .gte('starts_at', lowerWindow)
      .lte('starts_at', upperWindow);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: `Time conflict: Slot overlaps with "${conflicts[0].title}" at ${new Date(conflicts[0].starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        },
        { status: 409 }
      );
    }

    const { data: appt, error: insertErr } = await supabaseAdmin
      .from('appointments')
      .insert({
        business_id: auth.businessId,
        customer_id,
        title: title.trim(),
        starts_at: start.toISOString(),
        ends_at: ends_at ? new Date(ends_at).toISOString() : null,
        status: 'scheduled',
        created_by: auth.userId || null,
      })
      .select('*, customers(name, phone)')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    await logAudit({
      businessId: auth.businessId,
      userId: auth.userId,
      action: 'create_appointment_ui',
      entityType: 'appointment',
      entityId: appt.id,
      metadata: { title, starts_at: appt.starts_at },
    });

    return NextResponse.json({ success: true, appointment: appt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
