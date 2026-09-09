import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export interface AuthContext {
  userId?: string;
  userEmail?: string;
  businessId: string;
  businessName: string;
  role: 'owner' | 'staff';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sanitizeUserId(userId?: string): string | null {
  if (!userId) return null;
  if (!UUID_REGEX.test(userId)) return null;
  if (userId === '00000000-0000-0000-0000-000000000000' || userId === '00000000-0000-0000-0000-000000000001') {
    return null;
  }
  return userId;
}

export async function getAuthContext(): Promise<{
  auth: AuthContext | null;
  error?: string;
  needsOnboarding?: boolean;
}> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const currentUserId = user?.id;
    const userEmail = user?.email;

    // If no active auth user from cookies, check if demo/test session or existing business exists
    if (!currentUserId) {
      const { data: demoMembers } = await supabaseAdmin
        .from('business_members')
        .select('*, businesses(*)')
        .limit(1);

      if (demoMembers && demoMembers.length > 0) {
        const member = demoMembers[0];
        return {
          auth: {
            userId: sanitizeUserId(member.user_id) || undefined,
            userEmail: 'owner@karobaros.local',
            businessId: member.business_id,
            businessName: member.businesses?.name || 'My Karobar',
            role: member.role || 'owner',
          },
        };
      }

      // If no business exists at all in the database yet, auto-create a default business
      const { data: defaultBiz, error: bErr } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: 'My Karobar',
          category: 'services',
          city: 'New Delhi',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        })
        .select()
        .single();

      if (defaultBiz) {
        const { data: defaultMember } = await supabaseAdmin
          .from('business_members')
          .insert({
            business_id: defaultBiz.id,
            role: 'owner',
          })
          .select()
          .single();

        return {
          auth: {
            userId: undefined,
            userEmail: 'owner@karobaros.local',
            businessId: defaultBiz.id,
            businessName: defaultBiz.name,
            role: 'owner',
          },
        };
      }

      return { auth: null, error: 'Unauthorized. Please login.' };
    }

    // Lookup business member record
    const { data: members, error: memberError } = await supabaseAdmin
      .from('business_members')
      .select('*, businesses(*)')
      .eq('user_id', currentUserId)
      .limit(1);

    if (memberError) {
      console.error('Error fetching business member:', memberError);
      return { auth: null, error: 'Failed to resolve business membership' };
    }

    if (!members || members.length === 0) {
      return { auth: null, needsOnboarding: true };
    }

    const membership = members[0];
    return {
      auth: {
        userId: sanitizeUserId(currentUserId) || undefined,
        userEmail: userEmail,
        businessId: membership.business_id,
        businessName: membership.businesses?.name || 'My Business',
        role: membership.role as 'owner' | 'staff',
      },
    };
  } catch (err: any) {
    console.error('Auth context error:', err);
    return { auth: null, error: err.message || 'Internal authentication error' };
  }
}
