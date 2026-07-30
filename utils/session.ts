import * as SecureStore from 'expo-secure-store';

type SessionUser = {
  name: string;
  phone: string;
  address: string;
  isAdmin: boolean;
};

export type AdminOverviewSnapshot = {
  totalCustomers: number;
  activeSubs: number;
  totalMonthlyRevenue: number;
  pendingCount: number;
  capturedAt: number;
};

const KEYS = {
  hasSeenOnboarding: 'hasSeenOnboarding',
  user: 'sessionUser',
  lastRoute: 'lastRoute',
  adminOverviewSnapshot: 'adminOverviewSnapshot',
} as const;

function isSessionUser(v: unknown): v is SessionUser {
  if (v == null || typeof v !== 'object') return false;
  const u = v as any;
  return (
    typeof u.name === 'string' &&
    typeof u.phone === 'string' &&
    typeof u.address === 'string' &&
    typeof u.isAdmin === 'boolean'
  );
}

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEYS.hasSeenOnboarding)) === '1';
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(v: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.hasSeenOnboarding, v ? '1' : '0');
  } catch {}
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.user);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setSessionUser(user: SessionUser | null): Promise<void> {
  try {
    if (!user) {
      await SecureStore.deleteItemAsync(KEYS.user);
      return;
    }
    await SecureStore.setItemAsync(KEYS.user, JSON.stringify(user));
  } catch {}
}

export async function getLastRoute(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(KEYS.lastRoute)) ?? null;
  } catch {
    return null;
  }
}

export async function setLastRoute(route: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.lastRoute, route);
  } catch {}
}

function isAdminOverviewSnapshot(v: unknown): v is AdminOverviewSnapshot {
  if (v == null || typeof v !== 'object') return false;
  const s = v as any;
  return (
    typeof s.totalCustomers === 'number' &&
    typeof s.activeSubs === 'number' &&
    typeof s.totalMonthlyRevenue === 'number' &&
    typeof s.pendingCount === 'number' &&
    typeof s.capturedAt === 'number'
  );
}

export async function getAdminOverviewSnapshot(): Promise<AdminOverviewSnapshot | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.adminOverviewSnapshot);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAdminOverviewSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setAdminOverviewSnapshot(snapshot: AdminOverviewSnapshot | null): Promise<void> {
  try {
    if (!snapshot) {
      await SecureStore.deleteItemAsync(KEYS.adminOverviewSnapshot);
      return;
    }
    await SecureStore.setItemAsync(KEYS.adminOverviewSnapshot, JSON.stringify(snapshot));
  } catch {}
}
