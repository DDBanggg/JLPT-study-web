const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeLoginId(loginId: string): string {
  return loginId.trim().toLowerCase();
}

export function isValidLoginId(loginId: string): boolean {
  return LOGIN_ID_PATTERN.test(normalizeLoginId(loginId));
}

export function toInternalAuthEmail(loginId: string, domain: string): string {
  const normalized = normalizeLoginId(loginId);
  const normalizedDomain = domain.trim().toLowerCase();

  if (!LOGIN_ID_PATTERN.test(normalized)) {
    throw new Error("INVALID_LOGIN_ID");
  }

  if (!normalizedDomain || normalizedDomain.includes("@")) {
    throw new Error("INVALID_AUTH_LOGIN_DOMAIN");
  }

  return `${normalized}@${normalizedDomain}`;
}
