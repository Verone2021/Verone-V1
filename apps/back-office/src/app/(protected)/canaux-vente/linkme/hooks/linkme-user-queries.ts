import { createClient } from '@verone/utils/supabase/client';

import type {
  LinkMeUser,
  LinkMeRole,
  LinkMeUserView,
  EnseigneSelectOption,
} from './linkme-user-types';

const supabase = createClient();

// `email` is no longer a column of v_linkme_users (BO-SEC-CRITICAL-002 — RGPD).
// It is fetched separately via the SECURITY DEFINER RPC `get_linkme_users_emails`
// which is gated by `is_backoffice_user()` server-side.
const USER_SELECT_COLS =
  'user_id, user_role_id, first_name, last_name, avatar_url, phone, linkme_role, enseigne_id, organisation_id, permissions, is_active, role_created_at, default_margin_rate, enseigne_name, enseigne_logo, organisation_name, organisation_logo';

async function fetchEmailsForUsers(
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const cleanIds = userIds.filter(Boolean);
  if (cleanIds.length === 0) return map;
  const { data, error } = await supabase.rpc('get_linkme_users_emails', {
    user_ids: cleanIds,
  });
  if (error) {
    console.error('Erreur fetch LinkMe users emails:', error);
    return map;
  }
  for (const row of data ?? []) {
    if (row.user_id && row.email) map.set(row.user_id, row.email);
  }
  return map;
}

function mapUser(
  user: LinkMeUserView,
  emailByUserId: Map<string, string>
): LinkMeUser {
  const userId = user.user_id ?? '';
  return {
    user_id: userId,
    email: userId ? (emailByUserId.get(userId) ?? '') : '',
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: (user.linkme_role ?? 'client') as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions ?? [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at ?? '',
    default_margin_rate: user.default_margin_rate,
    enseigne_name: user.enseigne_name,
    enseigne_logo: user.enseigne_logo,
    organisation_name: user.organisation_name,
    organisation_logo: user.organisation_logo,
  };
}

export async function fetchLinkMeUsers(): Promise<LinkMeUser[]> {
  const { data, error } = await supabase
    .from('v_linkme_users')
    .select(USER_SELECT_COLS)
    .order('role_created_at', { ascending: false });
  if (error) {
    console.error('Erreur fetch LinkMe users:', error);
    throw error;
  }
  const rows = (data ?? []) as LinkMeUserView[];
  const userIds = rows
    .map(u => u.user_id)
    .filter((id): id is string => Boolean(id));
  const emailMap = await fetchEmailsForUsers(userIds);
  return rows.map(user => mapUser(user, emailMap));
}

export async function fetchLinkMeUserById(
  userId: string
): Promise<LinkMeUser | null> {
  const { data, error } = await supabase
    .from('v_linkme_users')
    .select(USER_SELECT_COLS)
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Erreur fetch LinkMe user:', error);
    throw error;
  }
  if (!data) return null;
  const emailMap = await fetchEmailsForUsers([userId]);
  return mapUser(data as LinkMeUserView, emailMap);
}

export async function fetchLinkMeUsersByEnseigne(
  enseigneId: string
): Promise<LinkMeUser[]> {
  const { data, error } = await supabase
    .from('v_linkme_users')
    .select(USER_SELECT_COLS)
    .eq('enseigne_id', enseigneId)
    .order('linkme_role')
    .order('role_created_at', { ascending: false });
  if (error) {
    console.error('Erreur fetch LinkMe users by enseigne:', error);
    throw error;
  }
  const rows = (data ?? []) as LinkMeUserView[];
  const userIds = rows
    .map(u => u.user_id)
    .filter((id): id is string => Boolean(id));
  const emailMap = await fetchEmailsForUsers(userIds);
  return rows.map(user => mapUser(user, emailMap));
}

export async function fetchEnseignesForSelect(): Promise<
  EnseigneSelectOption[]
> {
  const { data, error } = await supabase
    .from('enseignes')
    .select('id, name, logo_url')
    .eq('is_active', true)
    .order('name');
  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }
  return (data ?? []).map(e => ({
    id: e.id,
    name: e.name,
    logo_url: e.logo_url,
  }));
}

export async function fetchOrganisationsForSelect(
  enseigneId?: string,
  forOrganisationAdmin = false
) {
  let query = supabase
    .from('organisations')
    .select('id, legal_name, trade_name, logo_url, enseigne_id')
    .eq('is_active', true)
    .order('legal_name');
  if (enseigneId) query = query.eq('enseigne_id', enseigneId);
  const { data, error } = await query;
  if (error) {
    console.error('Erreur fetch organisations:', error);
    throw error;
  }
  let organisations = (data ?? []).map(org => ({
    id: org.id,
    name: org.trade_name ?? org.legal_name,
    logo_url: org.logo_url,
    enseigne_id: org.enseigne_id,
  }));
  if (forOrganisationAdmin) {
    const { data: existingRoles } = await supabase
      .from('user_app_roles')
      .select('organisation_id')
      .eq('app', 'linkme')
      .eq('role', 'organisation_admin')
      .not('organisation_id', 'is', null);
    const usedOrgIds = new Set(
      (existingRoles ?? [])
        .map(r => r.organisation_id)
        .filter((id): id is string => id !== null)
    );
    organisations = organisations.filter(org => !usedOrgIds.has(org.id));
  }
  return organisations;
}
