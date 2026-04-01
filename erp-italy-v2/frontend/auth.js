import { store, setUserBadge } from './lib/store.js';

export async function loadSession(sb) {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  store.session = data.session;
  return data.session;
}

export async function signIn(sb, email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  store.session = data.session;
  return data.session;
}

export async function signOut(sb) {
  await sb.auth.signOut();
  store.session = null;
  store.profile = null;
  setUserBadge('—');
}

export async function loadProfile(sb) {
  if (!store.session) {
    store.profile = null;
    return null;
  }
  const { data, error } = await sb.from('app_users').select('*').eq('id', store.session.user.id).limit(1);
  if (error) throw error;
  store.profile = (data && data[0]) || null;
  return store.profile;
}

export function isSignedIn() {
  return !!store.session;
}

export function requireRole(...roles) {
  if (!store.profile) return false;
  if (!store.profile.ativo) return false;
  if (roles.length === 0) return true;
  return roles.includes(store.profile.role);
}
