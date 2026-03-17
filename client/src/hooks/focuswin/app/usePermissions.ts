// client/src/hooks/focuswin/app/usePermissions.ts

import { useCallback, useEffect, useState } from "react";

export type PermissionState = "granted" | "denied" | "default" | "unsupported";

// #region Notification

export function useNotificationPermission() {
  const [state, setState] = useState<PermissionState>(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission as PermissionState;
  });

  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let permStatus: PermissionStatus | null = null;
    const handler = () => { if (permStatus) setState(permStatus.state as PermissionState); };

    navigator.permissions.query({ name: "notifications" }).then((status) => {
      permStatus = status;
      setState(status.state as PermissionState);
      status.addEventListener("change", handler);
    }).catch(() => {
      // 일부 환경에서 query 미지원 — 직접 Notification.permission 사용
      if ("Notification" in window) setState(Notification.permission as PermissionState);
    });

    return () => { permStatus?.removeEventListener("change", handler); };
  }, []);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";

    const result = await Notification.requestPermission();
    setState(result as PermissionState);
    return result as PermissionState;
  }, []);

  return { state, request };
}

// #endregion

// #region Microphone

export function useMicrophonePermission() {
  const [state, setState] = useState<PermissionState>("default");

  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let permStatus: PermissionStatus | null = null;
    const handler = () => { if (permStatus) setState(permStatus.state as PermissionState); };

    navigator.permissions.query({ name: "microphone" as PermissionName }).then((status) => {
      permStatus = status;
      setState(status.state as PermissionState);
      status.addEventListener("change", handler);
    }).catch(() => {
      // 브라우저 미지원 — 쿼리 불가, idle 유지
    });

    return () => { permStatus?.removeEventListener("change", handler); };
  }, []);

  return { state };
}

// #endregion
