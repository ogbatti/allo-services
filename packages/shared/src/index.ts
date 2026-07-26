/** Shared domain types for Allô Services / Types métier partagés */

export type LocaleCode = "fr" | "ee" | "en";

export type CaseStatus =
  | "registered"
  | "incomplete"
  | "awaiting_payment"
  | "in_review"
  | "ready"
  | "delivered"
  | "rejected"
  | "closed"
  | "cancelled";

export type ChannelCode =
  | "ussd"
  | "voice"
  | "sms"
  | "whatsapp"
  | "web"
  | "agent";

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded";

export type NotificationChannel = "sms" | "whatsapp" | "voice";

export type NotificationStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed";

export interface LocalizedText {
  fr: string;
  ee?: string;
  en?: string;
}

export interface JourneyStepOption {
  key: string;
  label: LocalizedText;
  next: string;
}

export interface JourneyStep {
  id: string;
  type: "menu" | "input" | "confirm" | "payment" | "end";
  prompt: LocalizedText;
  field?: string;
  options?: JourneyStepOption[];
  next?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface JourneyDefinition {
  id: string;
  version: string;
  tenantId: string;
  serviceCode: string;
  title: LocalizedText;
  feeAmount: number;
  feeCurrency: string;
  steps: JourneyStep[];
  startStepId: string;
}

/** Optional per-tenant connector selection (extension point for operators). */
export interface TenantConnectors {
  /** Payment connector id, e.g. simulator | stub-momo */
  payment?: string;
  /** SMS connector id, e.g. simulator | stub-sms */
  sms?: string;
}

export interface TenantConfig {
  id: string;
  countryCode: string;
  name: LocalizedText;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  currency: string;
  ussdShortCode: string;
  voiceShortNumber: string;
  smsSenderId: string;
  modules: string[];
  connectors?: TenantConnectors;
}

export interface CaseSummary {
  id: string;
  trackingNumber: string;
  tenantId: string;
  serviceCode: string;
  status: CaseStatus;
  channel: ChannelCode;
  phoneNumber: string;
  locale: LocaleCode;
  feeAmount: number;
  feeCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export const CASE_STATUS_LABELS: Record<
  CaseStatus,
  LocalizedText
> = {
  registered: {
    fr: "Enregistré",
    ee: "Eŋlɔe",
    en: "Registered",
  },
  incomplete: {
    fr: "Incomplet",
    ee: "Meɖe go o",
    en: "Incomplete",
  },
  awaiting_payment: {
    fr: "En attente de paiement",
    ee: "Ele gaƒoƒo dzi",
    en: "Awaiting payment",
  },
  in_review: {
    fr: "En instruction",
    ee: "Wole eŋu kpɔm",
    en: "In review",
  },
  ready: {
    fr: "Prêt",
    ee: "Edo",
    en: "Ready",
  },
  delivered: {
    fr: "Remis",
    ee: "Wotsɔe",
    en: "Delivered",
  },
  rejected: {
    fr: "Rejeté",
    ee: "Wogbe",
    en: "Rejected",
  },
  closed: {
    fr: "Clos",
    ee: "Wotu",
    en: "Closed",
  },
  cancelled: {
    fr: "Annulé",
    ee: "Wotɔe",
    en: "Cancelled",
  },
};

export function pickLocale(
  text: LocalizedText,
  locale: LocaleCode,
): string {
  return text[locale] ?? text.fr;
}

export {
  SERVICE_PACKS,
  SERVICE_MODULE,
  SERVICE_CODE_ORDER,
  getServicePack,
  moduleForService,
  fillTemplate,
  packLabel,
} from "./service-packs";
export type {
  ServicePackDefinition,
  InstructAction,
} from "./service-packs";
