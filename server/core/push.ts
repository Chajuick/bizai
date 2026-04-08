// server/core/push.ts
// Web Push (VAPID) 발송 모듈

import webpush from "web-push";
import { ENV } from "./env/env";

let _initialized = false;

function init() {
  if (_initialized) return;
  const { vapidPublicKey, vapidPrivateKey, vapidEmail } = ENV;
  if (!vapidPublicKey || !vapidPrivateKey) return; // 미설정 시 무음 skip
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  _initialized = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<boolean> {
  init();
  if (!_initialized) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    // 410 Gone / 404 = 구독 만료 (호출 측에서 처리)
    if (code === 410 || code === 404) throw err;
    console.error("[Push] sendPush error", err);
    return false;
  }
}

export const VAPID_PUBLIC_KEY = () => ENV.vapidPublicKey;
