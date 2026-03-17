// #region Types

export type ConfirmIntent = "delete" | "cancel" | "complete";

export type ConfirmMeta = {
  label: string;               // "거래처", "상태", "금액"...
  value: string;               // "우진테크", "대기", "590만원"
  tone?: "default" | "muted" | "danger" | "primary";
};

export type ConfirmTarget =
  | { kind: "sale"; id: number; title: string; metas: ConfirmMeta[] }
  | { kind: "shipment"; id: number; title: string; metas: ConfirmMeta[] }
  | { kind: "order"; id: number; title: string; metas: ConfirmMeta[] }
  | { kind: "schedule"; id: number; title: string; metas: ConfirmMeta[] }
  | { kind: "client"; id: number; title: string; metas: ConfirmMeta[] }
  | { kind: "expense"; id: number; title: string; metas: ConfirmMeta[] };

export type ConfirmState =
  | null
  | {
      intent: ConfirmIntent;
      target: ConfirmTarget;
      description?: string; // fallback 텍스트 (UI가 metas 없을 때 사용)
    };

// #endregion