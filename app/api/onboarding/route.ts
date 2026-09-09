import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If user is authenticated, use their id; otherwise generate a demo owner or register
    const body = await req.json();
    const { name, category, city, phone, working_hours } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    let userId = user?.id;

    // If no user session, check if demo/standalone setup
    if (!userId) {
      // Check if a demo user profile exists, or create one in profiles
      const demoId = '00000000-0000-0000-0000-000000000001';
      userId = demoId;
    }

    // 1. Create Business
    const { data: business, error: bErr } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: name.trim(),
        category: category || 'services',
        city: city || 'New Delhi',
        phone: phone || null,
        working_hours: working_hours || { open: '09:00', close: '21:00' },
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (bErr) {
      console.error('Onboarding business error:', bErr);
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    // 2. Create Business Member (Role: owner)
    const { data: member, error: mErr } = await supabaseAdmin
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: user?.id || null,
        role: 'owner',
      })
      .select()
      .single();

    if (mErr) {
      console.error('Onboarding member error:', mErr);
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    // 3. Seed initial default services for convenience
    await supabaseAdmin.from('services').insert([
      { business_id: business.id, name: 'Standard Service / Product', price: 500, active: true },
      { business_id: business.id, name: 'Premium Service / Consultation', price: 1200, active: true },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Business created successfully',
      business,
      member,
    });
  } catch (err: any) {
    console.error('Onboarding exception:', err);
    return NextResponse.json({ error: err.message || 'Onboarding failed' }, { status: 500 });
  }
}
