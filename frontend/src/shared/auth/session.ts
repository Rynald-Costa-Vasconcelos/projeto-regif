export type Permission = { slug: string };

export type SessionRole =
  | string
  | {
      name?: string;
      permissions?: Permission[];
    };

export type SessionUser = {
  id?: string;
  name: string;
  email: string;
  role: SessionRole;
  avatarUrl?: string | null;
};

const TOKEN_KEY = "regif-token";
const USER_KEY = "regif-user";

type StorageKind = "local" | "session";

function resolveStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

function getFromAnyStorage(key: string) {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return fromLocal;
  return sessionStorage.getItem(key);
}

export function getToken() {
  return getFromAnyStorage(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  const raw = getFromAnyStorage(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(input: { token: string; user: SessionUser; rememberMe: boolean }) {
  const storage = resolveStorage(input.rememberMe);
  storage.setItem(TOKEN_KEY, input.token);
  storage.setItem(USER_KEY, JSON.stringify(input.user));

  // Garante que só exista 1 sessão (evita conflito local vs session)
  const other: StorageKind = input.rememberMe ? "session" : "local";
  const otherStorage = other === "local" ? localStorage : sessionStorage;
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(USER_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getRoleName(user: SessionUser | null) {
  if (!user) return null;
  return typeof user.role === "object" ? (user.role?.name ?? null) : user.role;
}

export function hasPermission(user: SessionUser | null, slug: string) {
  if (!user) return false;

  const roleName = getRoleName(user);
  if (roleName === "ADMIN") return true;

  if (typeof user.role === "object") {
    const permissions = user.role.permissions ?? [];
    return permissions.some((p) => p.slug === slug);
  }

  return false;
}
