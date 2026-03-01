// src/router/redirect.ts

const KEY = "auth_redirect";

/**
 * 로그인 후 되돌아갈 경로를 저장합니다.
 * - /auth/* 는 저장하지 않음
 * - "/" 는 의미 없으므로 저장하지 않음
 * - 이미 값이 있으면 덮어쓰지 않음(사용자 흐름 보호: 최초 의도 유지)
 */
export function preserveAuthRedirect(path: string): void {
  if (!path) return;

  // auth 페이지는 저장 금지
  if (path.startsWith("/auth/")) return;

  // 루트는 "복귀할 곳 없음"이므로 저장 금지 (기존 값 덮어쓰는 사고 방지)
  if (path === "/") return;

  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return; // ✅ 이미 값이 있으면 절대 덮어쓰지 않음
    sessionStorage.setItem(KEY, path);
  } catch {
    // sessionStorage 불가 환경에서도 앱이 죽지 않게 무시
  }
}

/** 저장된 redirect 경로를 꺼내되, 삭제는 하지 않음 */
export function peekAuthRedirect(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** 저장된 redirect 경로를 꺼내고 삭제 */
export function popAuthRedirect(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (!v) return null;
    sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}

export function clearAuthRedirect(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}