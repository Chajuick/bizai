// server/modules/ai/ai.util.ts

// #region Types

export type ActionOwner = "self" | "client" | "shared";

export type AiCoreAppointment = {
  title: string;
  date: string | null;
  desc: string;
  action_owner: ActionOwner;

  // ✅ schedule.aiex_keys 와 1:1 매칭용
  key: string;
};

export type AiCorePricingEntry = {
  amount: number | null;
  min: number | null;
  max: number | null;
  type: "one_time" | "monthly" | "yearly";
  vat: "included" | "excluded" | "unknown";
  approximate: boolean;
  inferred: boolean;
  label: string;
};

export type AiCorePricing = {
  primary: AiCorePricingEntry | null;
  alternatives: AiCorePricingEntry[];
  final: AiCorePricingEntry | null;
} | null;

export type AiCore = {
  pricing: AiCorePricing;
  notes: string;
  appointments: AiCoreAppointment[];
};

// #endregion

// #region Helpers

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeNotes(v: unknown): string {
  return safeString(v).trim();
}

function normalizeAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return Math.trunc(n);
  }
  return null;
}

function normalizeActionOwner(v: unknown): ActionOwner {
  if (v === "self" || v === "client" || v === "shared") return v;
  return "self";
}

function normalizeDateOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  return s;
}

function normalizeTitle(v: unknown): string {
  const s = safeString(v).trim();
  return s || "AI 후속 조치";
}

function normalizeDesc(v: unknown): string {
  const s = safeString(v).trim();
  return s || "";
}

function normalizeAppointments(v: unknown): Array<{
  title: unknown;
  date: unknown;
  desc: unknown;
  action_owner: unknown;
}> {
  if (!Array.isArray(v)) return [];
  return v.map((x) => ({
    title: (x as any)?.title,
    date: (x as any)?.date,
    desc: (x as any)?.desc,
    action_owner: (x as any)?.action_owner,
  }));
}

// #endregion

// #region Public: Keys

export function makeAiApptKey(input: { title: string; date: string | null; action_owner: ActionOwner }): string {
  const t = (input.title ?? "").trim().toLowerCase();
  const d = (input.date ?? "").trim();
  const o = input.action_owner;

  const raw = `${t}|${d}|${o}`;

  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  const h = (hash >>> 0).toString(16);

  const head = t.replace(/\s+/g, "").slice(0, 18);
  const tail = d.replace(/[:+\-TZ]/g, "").slice(0, 14);

  const key = `aiex_${head}_${tail}_${o}_${h}`;
  return key.slice(0, 64);
}

// #endregion

// #region Pricing Normalizers

function normalizePricingType(v: unknown): AiCorePricingEntry["type"] {
  if (v === "monthly") return "monthly";
  if (v === "yearly") return "yearly";
  return "one_time";
}

function normalizePricingVat(v: unknown): AiCorePricingEntry["vat"] {
  if (v === "included") return "included";
  if (v === "excluded") return "excluded";
  return "unknown";
}

function normalizePricingEntry(raw: unknown): AiCorePricingEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as any;

  const amount = normalizeAmount(obj.amount);
  const min = normalizeAmount(obj.min);
  const max = normalizeAmount(obj.max);

  // amount와 min/max 모두 없으면 의미 없는 항목
  if (amount === null && min === null && max === null) return null;

  return {
    amount,
    min,
    max,
    type: normalizePricingType(obj.type),
    vat: normalizePricingVat(obj.vat),
    approximate: !!obj.approximate,
    inferred: !!obj.inferred,
    label: typeof obj.label === "string" ? obj.label.trim() : "",
  };
}

function normalizePricing(rawPricing: unknown, legacyAmount: unknown): AiCorePricing {
  // 신규 pricing 객체 포맷
  if (rawPricing && typeof rawPricing === "object") {
    const obj = rawPricing as any;
    const primary = normalizePricingEntry(obj.primary);
    const alternatives = Array.isArray(obj.alternatives)
      ? (obj.alternatives as unknown[]).map(normalizePricingEntry).filter((x): x is AiCorePricingEntry => x !== null)
      : [];
    const final = normalizePricingEntry(obj.final);

    if (primary || alternatives.length > 0 || final) {
      return { primary, alternatives, final };
    }
  }

  // 구버전 amount 필드 호환
  const legacyAmt = normalizeAmount(legacyAmount);
  if (legacyAmt !== null) {
    return {
      primary: {
        amount: legacyAmt,
        min: null,
        max: null,
        type: "one_time",
        vat: "unknown",
        approximate: false,
        inferred: false,
        label: "",
      },
      alternatives: [],
      final: null,
    };
  }

  return null;
}

// #endregion

// #region Public: Core Normalizer

export function toAiCore(aiex_text: unknown): AiCore {
  const obj = (aiex_text ?? {}) as any;

  const pricing = normalizePricing(obj.pricing, obj.amount);
  const notes = normalizeNotes(obj.notes);

  const apptsRaw = normalizeAppointments(obj.appointments);

  const appointments: AiCoreAppointment[] = apptsRaw.map((a) => {
    const action_owner = normalizeActionOwner(a.action_owner);
    const title = normalizeTitle(a.title);
    const date = normalizeDateOrNull(a.date);
    const desc = normalizeDesc(a.desc);

    // ✅ 여기서 key를 반드시 채워서 반환
    const key = makeAiApptKey({ title, date, action_owner });

    return { title, date, desc, action_owner, key };
  });

  return { pricing, notes, appointments };
}

// #endregion