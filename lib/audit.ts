import { supabaseAdmin } from './supabase/admin';
import { sanitizeUserId } from './auth';

export interface LogAuditParams {
  businessId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export async function logAudit({
  businessId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: LogAuditParams) {
  try {
    const validUserId = sanitizeUserId(userId);
    await supabaseAdmin.from('audit_logs').insert({
      business_id: businessId,
      user_id: validUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
