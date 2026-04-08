// client/src/lib/push.ts
// Web Push 구독 관리 헬퍼

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export async function subscribePush(vapidPublicKey: string): Promise<{
  endpoint: string;
  p256dh: string;
  auth: string;
} | null> {
  const reg = await registerServiceWorker();
  if (!reg) return null;

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh ?? "";
    const auth   = json.keys?.auth   ?? "";
    if (!p256dh || !auth) return null;

    return { endpoint: sub.endpoint, p256dh, auth };
  } catch {
    return null;
  }
}

export async function unsubscribePush(): Promise<string | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}
