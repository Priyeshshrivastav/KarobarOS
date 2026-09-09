import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { auth, error: authError } = await getAuthContext();
    if (authError || !auth) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const businessId = auth.businessId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Sales today
    const { data: todaySales } = await supabaseAdmin
      .from('sales')
      .select('total_amount, status, created_at')
      .eq('business_id', businessId)
      .gte('created_at', todayStart.toISOString());

    const todayRevenue = (todaySales || []).reduce(
      (acc, s) => acc + Number(s.total_amount || 0),
      0
    );

    // 2. Pending payments (unpaid udhaar)
    const { data: pendingSales } = await supabaseAdmin
      .from('sales')
      .select('total_amount')
      .eq('business_id', businessId)
      .eq('status', 'pending');

    const pendingUdhaar = (pendingSales || []).reduce(
      (acc, s) => acc + Number(s.total_amount || 0),
      0
    );

    // 3. Today's appointments
    const { data: todayAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*, customers(id, name, phone)')
      .eq('business_id', businessId)
      .eq('status', 'scheduled')
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .order('starts_at', { ascending: true });

    // 4. Pending tasks
    const { data: pendingTasks } = await supabaseAdmin
      .from('tasks')
      .select('*, customers(id, name)')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // 5. Total customers count
    const { count: totalCustomers } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    // 6. Recent activity from audit_logs
    const { data: recentActivity } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(6);

    return NextResponse.json({
      success: true,
      business: {
        id: businessId,
        name: auth.businessName,
      },
      metrics: {
        todayRevenue,
        todaySalesCount: todaySales?.length || 0,
        pendingUdhaar,
        pendingPaymentsCount: pendingSales?.length || 0,
        todayAppointmentsCount: todayAppointments?.length || 0,
        pendingTasksCount: pendingTasks?.length || 0,
        totalCustomers: totalCustomers || 0,
        currency: 'INR',
      },
      todayAppointments: todayAppointments || [],
      pendingTasks: pendingTasks || [],
      recentActivity: recentActivity || [],
    });
  } catch (err: any) {
    console.error('Dashboard API Error:', err);
    return NextResponse.json({ error: err.message || 'Dashboard failed' }, { status: 500 });
  }
}
