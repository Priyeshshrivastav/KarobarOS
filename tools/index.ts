import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { sanitizeUserId } from '@/lib/auth';

export interface ToolExecutionContext {
  businessId: string;
  userId?: string;
  conversationId?: string;
}

// Utility: Normalize Indian phone numbers (10 digits)
export function sanitizeIndianPhone(phone: string): { valid: boolean; formatted: string; error?: string } {
  if (!phone) return { valid: false, formatted: '', error: 'Phone number is required' };
  
  // Strip spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Strip leading +91 or 91 or 0 if 12/11 digits
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Validate 10 digits starting with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      formatted: cleaned,
      error: 'Invalid Indian phone number. Must be a 10-digit number starting with 6-9.',
    };
  }

  return { valid: true, formatted: cleaned };
}

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<Record<string, any>> {
  const { businessId, userId, conversationId } = ctx;
  const sanitizedUserId = sanitizeUserId(userId) || null;

  switch (toolName) {
    case 'create_customer': {
      const { name, phone, email, tags } = args;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return { success: false, error: 'Customer name is required' };
      }

      const phoneValidation = sanitizeIndianPhone(phone);
      if (!phoneValidation.valid) {
        return { success: false, error: phoneValidation.error };
      }

      // Check for duplicate phone in same business
      const { data: existing } = await supabaseAdmin
        .from('customers')
        .select('id, name, phone')
        .eq('business_id', businessId)
        .eq('phone', phoneValidation.formatted)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: `Customer with phone ${phoneValidation.formatted} already exists (${existing.name}).`,
          existing_customer: existing,
        };
      }

      const { data: newCustomer, error } = await supabaseAdmin
        .from('customers')
        .insert({
          business_id: businessId,
          name: name.trim(),
          phone: phoneValidation.formatted,
          email: email?.trim() || null,
          tags: Array.isArray(tags) ? tags : [],
          total_spent: 0,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      await logAudit({
        businessId,
        userId,
        action: 'create_customer',
        entityType: 'customer',
        entityId: newCustomer.id,
        metadata: { name: newCustomer.name, phone: newCustomer.phone },
      });

      return {
        success: true,
        message: `Customer ${newCustomer.name} (${newCustomer.phone}) added successfully.`,
        customer: newCustomer,
      };
    }

    case 'search_customers': {
      const { query } = args;
      if (!query || typeof query !== 'string') {
        return { success: false, error: 'Search query is required' };
      }

      const cleanQuery = query.trim();
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .or(`name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
        .limit(10);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        count: data?.length || 0,
        customers: data || [],
      };
    }

    case 'get_customer': {
      const { customer_id } = args;
      if (!customer_id) return { success: false, error: 'customer_id is required' };

      const { data: customer, error: cErr } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .eq('id', customer_id)
        .single();

      if (cErr || !customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Recent 5 sales
      const { data: sales } = await supabaseAdmin
        .from('sales')
        .select('*, sale_items(*)')
        .eq('business_id', businessId)
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Recent notes
      const { data: notes } = await supabaseAdmin
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        success: true,
        customer,
        recent_sales: sales || [],
        notes: notes || [],
      };
    }

    case 'update_customer': {
      const { customer_id, fields } = args;
      if (!customer_id || !fields || typeof fields !== 'object') {
        return { success: false, error: 'customer_id and fields object are required' };
      }

      const updateData: Record<string, any> = {};
      if (fields.name) updateData.name = fields.name.trim();
      if (fields.phone) {
        const val = sanitizeIndianPhone(fields.phone);
        if (!val.valid) return { success: false, error: val.error };
        updateData.phone = val.formatted;
      }
      if (fields.email !== undefined) updateData.email = fields.email ? fields.email.trim() : null;
      if (Array.isArray(fields.tags)) updateData.tags = fields.tags;

      const { data, error } = await supabaseAdmin
        .from('customers')
        .update(updateData)
        .eq('business_id', businessId)
        .eq('id', customer_id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await logAudit({
        businessId,
        userId,
        action: 'update_customer',
        entityType: 'customer',
        entityId: customer_id,
        metadata: updateData,
      });

      return { success: true, customer: data };
    }

    case 'create_sale': {
      const { customer_id, items, amount, status = 'completed' } = args;
      if (!customer_id) return { success: false, error: 'customer_id is required' };
      
      const saleAmount = Number(amount);
      if (isNaN(saleAmount) || saleAmount <= 0) {
        return { success: false, error: 'Valid positive amount in INR is required' };
      }

      // Verify customer exists
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id, name, total_spent')
        .eq('business_id', businessId)
        .eq('id', customer_id)
        .single();

      if (!customer) return { success: false, error: 'Customer not found' };

      // Insert sale
      const { data: sale, error: sErr } = await supabaseAdmin
        .from('sales')
        .insert({
          business_id: businessId,
          customer_id,
          total_amount: saleAmount,
          status,
          created_by: sanitizedUserId,
        })
        .select()
        .single();

      if (sErr) return { success: false, error: sErr.message };

      // Insert sale items if provided
      if (Array.isArray(items) && items.length > 0) {
        const itemInserts = items.map((it: any) => ({
          sale_id: sale.id,
          name: it.name || 'Service/Item',
          price: Number(it.price) || saleAmount,
          quantity: Number(it.quantity) || 1,
        }));
        await supabaseAdmin.from('sale_items').insert(itemInserts);
      }

      // Update customer total_spent and last_visit_at
      const newTotal = (Number(customer.total_spent) || 0) + saleAmount;
      await supabaseAdmin
        .from('customers')
        .update({
          total_spent: newTotal,
          last_visit_at: new Date().toISOString(),
        })
        .eq('id', customer_id);

      await logAudit({
        businessId,
        userId,
        action: 'create_sale',
        entityType: 'sale',
        entityId: sale.id,
        metadata: { customerName: customer.name, amount: saleAmount, status },
      });

      return {
        success: true,
        message: `Sale of ₹${saleAmount} for ${customer.name} recorded.`,
        sale_id: sale.id,
        amount: saleAmount,
        status,
      };
    }

    case 'get_sales_summary': {
      const { period = 'today' } = args;
      const now = new Date();
      let startDate = new Date();

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        const day = startDate.getDay() || 7;
        startDate.setDate(startDate.getDate() - day + 1);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const { data: sales, error } = await supabaseAdmin
        .from('sales')
        .select('total_amount, status, created_at')
        .eq('business_id', businessId)
        .gte('created_at', startDate.toISOString());

      if (error) return { success: false, error: error.message };

      const totalRevenue = (sales || []).reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      const completedCount = (sales || []).filter(s => s.status === 'completed').length;
      const pendingCount = (sales || []).filter(s => s.status === 'pending').length;

      return {
        success: true,
        period,
        total_revenue: totalRevenue,
        transaction_count: sales?.length || 0,
        completed_transactions: completedCount,
        pending_transactions: pendingCount,
        currency: 'INR',
      };
    }

    case 'get_pending_payments': {
      const { data: pendingSales, error } = await supabaseAdmin
        .from('sales')
        .select('*, customers(id, name, phone)')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };

      const totalPending = (pendingSales || []).reduce(
        (acc, curr) => acc + Number(curr.total_amount || 0),
        0
      );

      return {
        success: true,
        total_pending_amount: totalPending,
        count: pendingSales?.length || 0,
        pending_sales: pendingSales || [],
      };
    }

    case 'create_appointment': {
      const { customer_id, title, starts_at, ends_at } = args;
      if (!customer_id || !title || !starts_at) {
        return { success: false, error: 'customer_id, title, and starts_at are required' };
      }

      const start = new Date(starts_at);
      if (isNaN(start.getTime())) {
        return { success: false, error: 'Invalid starts_at date/time format' };
      }

      // Slot conflict check (+/- 30 minutes)
      const lowerWindow = new Date(start.getTime() - 29 * 60 * 1000).toISOString();
      const upperWindow = new Date(start.getTime() + 29 * 60 * 1000).toISOString();

      const { data: conflicts } = await supabaseAdmin
        .from('appointments')
        .select('id, title, starts_at')
        .eq('business_id', businessId)
        .eq('status', 'scheduled')
        .gte('starts_at', lowerWindow)
        .lte('starts_at', upperWindow);

      if (conflicts && conflicts.length > 0) {
        return {
          success: false,
          conflict: true,
          error: `Time conflict: Slot overlaps with "${conflicts[0].title}" at ${new Date(conflicts[0].starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please choose another time.`,
        };
      }

      const { data: appt, error } = await supabaseAdmin
        .from('appointments')
        .insert({
          business_id: businessId,
          customer_id,
          title: title.trim(),
          starts_at: start.toISOString(),
          ends_at: ends_at ? new Date(ends_at).toISOString() : null,
          status: 'scheduled',
          created_by: sanitizedUserId,
        })
        .select('*, customers(name, phone)')
        .single();

      if (error) return { success: false, error: error.message };

      await logAudit({
        businessId,
        userId,
        action: 'create_appointment',
        entityType: 'appointment',
        entityId: appt.id,
        metadata: { title, starts_at: appt.starts_at },
      });

      return {
        success: true,
        message: `Appointment "${appt.title}" scheduled for ${new Date(appt.starts_at).toLocaleString('en-IN')}.`,
        appointment: appt,
      };
    }

    case 'get_appointments': {
      const { date_range = 'upcoming' } = args;
      const now = new Date();
      let query = supabaseAdmin
        .from('appointments')
        .select('*, customers(name, phone)')
        .eq('business_id', businessId)
        .order('starts_at', { ascending: true });

      if (date_range === 'today') {
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        query = query.gte('starts_at', start).lte('starts_at', end);
      } else if (date_range === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const start = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        const end = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
        query = query.gte('starts_at', start).lte('starts_at', end);
      } else {
        query = query.gte('starts_at', new Date().toISOString());
      }

      const { data, error } = await query.limit(20);
      if (error) return { success: false, error: error.message };

      return {
        success: true,
        filter: date_range,
        appointments: data || [],
      };
    }

    case 'cancel_appointment': {
      const { appointment_id, confirmed, reason } = args;
      if (!appointment_id) return { success: false, error: 'appointment_id is required' };

      // Fetch appointment details
      const { data: appt } = await supabaseAdmin
        .from('appointments')
        .select('*, customers(name, phone)')
        .eq('business_id', businessId)
        .eq('id', appointment_id)
        .single();

      if (!appt) return { success: false, error: 'Appointment not found' };

      // If not confirmed yet, trigger confirmation state
      if (!confirmed) {
        const { data: action } = await supabaseAdmin
          .from('ai_actions')
          .insert({
            business_id: businessId,
            conversation_id: conversationId,
            tool_name: 'cancel_appointment',
            input: { appointment_id, reason, customer_name: appt.customers?.name, title: appt.title, starts_at: appt.starts_at },
            status: 'needs_confirmation',
            requires_confirmation: true,
          })
          .select()
          .single();

        return {
          needs_confirmation: true,
          ai_action_id: action?.id,
          prompt: `Are you sure you want to cancel the appointment "${appt.title}" for ${appt.customers?.name || 'customer'} on ${new Date(appt.starts_at).toLocaleString('en-IN')}?`,
          action_details: {
            type: 'cancel_appointment',
            appointment_id,
            title: appt.title,
            customer_name: appt.customers?.name,
            starts_at: appt.starts_at,
          },
        };
      }

      // Execute cancellation
      const { data: updated, error } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment_id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await logAudit({
        businessId,
        userId,
        action: 'cancel_appointment',
        entityType: 'appointment',
        entityId: appointment_id,
        metadata: { reason },
      });

      return {
        success: true,
        message: `Appointment "${appt.title}" has been cancelled.`,
        appointment: updated,
      };
    }

    case 'create_task': {
      const { title, due_at, customer_id } = args;
      if (!title) return { success: false, error: 'Task title is required' };

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          business_id: businessId,
          title: title.trim(),
          due_at: due_at ? new Date(due_at).toISOString() : null,
          related_customer_id: customer_id || null,
          status: 'pending',
          created_by: sanitizedUserId,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await logAudit({
        businessId,
        userId,
        action: 'create_task',
        entityType: 'task',
        entityId: data.id,
        metadata: { title },
      });

      return {
        success: true,
        message: `Task "${data.title}" added.`,
        task: data,
      };
    }

    case 'complete_task': {
      const { task_id } = args;
      if (!task_id) return { success: false, error: 'task_id is required' };

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .update({ status: 'completed' })
        .eq('business_id', businessId)
        .eq('id', task_id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await logAudit({
        businessId,
        userId,
        action: 'complete_task',
        entityType: 'task',
        entityId: task_id,
      });

      return {
        success: true,
        message: `Task marked as completed!`,
        task: data,
      };
    }

    case 'get_business_summary': {
      // 1. Today's sales
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: sales } = await supabaseAdmin
        .from('sales')
        .select('total_amount, status')
        .eq('business_id', businessId)
        .gte('created_at', todayStart.toISOString());

      const todayRevenue = (sales || []).reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

      // 2. Pending payments count
      const { count: pendingSalesCount } = await supabaseAdmin
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      // 3. Today's appointments count
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { count: todayApptsCount } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'scheduled')
        .gte('starts_at', todayStart.toISOString())
        .lte('starts_at', todayEnd.toISOString());

      // 4. Pending tasks count
      const { count: pendingTasksCount } = await supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');

      // 5. Total customers
      const { count: customersCount } = await supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      return {
        success: true,
        summary: {
          today_revenue: todayRevenue,
          today_sales_count: sales?.length || 0,
          pending_payments_count: pendingSalesCount || 0,
          today_appointments_count: todayApptsCount || 0,
          pending_tasks_count: pendingTasksCount || 0,
          total_customers_count: customersCount || 0,
          currency: 'INR',
        },
      };
    }

    case 'draft_customer_message': {
      const { customer_id, purpose, language = 'hinglish' } = args;
      if (!customer_id) return { success: false, error: 'customer_id is required' };

      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .eq('id', customer_id)
        .single();

      if (!customer) return { success: false, error: 'Customer not found' };

      let draft = '';
      if (language === 'hinglish') {
        draft = `Namaste ${customer.name} ji! Umeed hai aap badhiya hain. KarobarOS ki taraf se aapko yeh message bhej rahe hain regarding ${purpose}. Kisi bhi sawaal ke liye please hume contact karein! Dhanyawad.`;
      } else if (language === 'hindi') {
        draft = `नमस्ते ${customer.name} जी! आशा है आप सकुशल हैं। यह संदेश ${purpose} के संबंध में है। किसी भी जानकारी के लिए कृपया हमसे संपर्क करें। धन्यवाद।`;
      } else {
        draft = `Hello ${customer.name}, greetings! We are reaching out regarding ${purpose}. Please feel free to reply if you have any questions. Thank you!`;
      }

      return {
        success: true,
        customer_name: customer.name,
        phone: customer.phone,
        purpose,
        language,
        draft_message: draft,
      };
    }

    case 'send_customer_message': {
      const { customer_id, message, confirmed } = args;
      if (!customer_id || !message) {
        return { success: false, error: 'customer_id and message are required' };
      }

      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id, name, phone')
        .eq('business_id', businessId)
        .eq('id', customer_id)
        .single();

      if (!customer) return { success: false, error: 'Customer not found' };

      if (!confirmed) {
        const { data: action } = await supabaseAdmin
          .from('ai_actions')
          .insert({
            business_id: businessId,
            conversation_id: conversationId,
            tool_name: 'send_customer_message',
            input: { customer_id, customer_name: customer.name, phone: customer.phone, message },
            status: 'needs_confirmation',
            requires_confirmation: true,
          })
          .select()
          .single();

        return {
          needs_confirmation: true,
          ai_action_id: action?.id,
          prompt: `Send this message to ${customer.name} (${customer.phone})?`,
          action_details: {
            type: 'send_customer_message',
            customer_name: customer.name,
            phone: customer.phone,
            message,
          },
        };
      }

      // Record dispatch notification
      await supabaseAdmin.from('notifications').insert({
        business_id: businessId,
        title: `Message sent to ${customer.name}`,
        body: message,
      });

      await logAudit({
        businessId,
        userId,
        action: 'send_customer_message',
        entityType: 'customer',
        entityId: customer_id,
        metadata: { phone: customer.phone, message },
      });

      return {
        success: true,
        message: `Message dispatched successfully to ${customer.name} (${customer.phone}).`,
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}
