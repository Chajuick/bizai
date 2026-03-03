// src/types/ai.ts

// #region AI Contact

export type AiContact = {
  cont_name: string;
  cont_role?: string | null;
  cont_tele?: string | null;
  cont_mail?: string | null;
};

// #endregion

// #region Post Analyze Client State

export type PostAnalyzeClientState = {
  ai_client_name: string;
  matched_idno: number | null;
  matched_name: string | null;
  ai_contacts: AiContact[];
} | null;

// #endregion

// #region AI Core

export type AiCoreAppointment = {
  title: string;
  date: string | null;
  desc: string;
  action_owner: "self" | "client" | "shared";
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