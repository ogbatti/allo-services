const FLY_API = "https://allo-services-api.fly.dev/api/v1";

/** Prefer Fly for hosted demos; localhost only for local Next.js. */
function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".vercel.app") || host === "allo-services.vercel.app") {
      return FLY_API;
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return fromEnv ?? "http://localhost:3001/api/v1";
    }
  }
  return fromEnv ?? FLY_API;
}

const TOKEN_KEY = "allo_instructor_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function formatApiError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      message?: string | string[] | { fr?: string; en?: string };
      error?: string;
    };
    const msg = parsed.message;
    if (typeof msg === "object" && msg && "fr" in msg && msg.fr) return msg.fr;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") {
      if (status === 404 && msg.includes("/auth/login")) {
        return "API indisponible ou ancienne version (auth). Rechargez après déploiement.";
      }
      return msg;
    }
    if (parsed.error) return `${parsed.error} (${status})`;
  } catch {
    /* raw body */
  }
  return body || `HTTP ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(formatApiError(res.status, body));
  }
  return res.json() as Promise<T>;
}

export type UssdResponse = {
  sessionId: string;
  continue: boolean;
  message: string;
  stepId: string;
  trackingNumber?: string;
};

export type CaseSummary = {
  id: string;
  trackingNumber: string;
  tenantId: string;
  serviceCode: string;
  status: string;
  channel: string;
  phoneNumber: string;
  locale: string;
  feeAmount: number;
  feeCurrency: string;
  createdAt: string;
  updatedAt: string;
  payload?: Record<string, string>;
  allowedTransitions?: string[];
};

export type CaseDetails = CaseSummary & {
  payload: Record<string, string>;
  allowedTransitions: string[];
  events?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actor: string;
    note: string | null;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    channel: string;
    body: string;
    status: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    externalRef: string | null;
  }>;
};

export type Instructor = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
};

export type TenantSummary = {
  id: string;
  countryCode: string;
  name: { fr: string; ee?: string; en?: string };
  defaultLocale: string;
  supportedLocales: string[];
  ussdShortCode: string;
  modules: string[];
};

export function ussdStep(body: {
  tenantId: string;
  phoneNumber: string;
  sessionId?: string;
  input?: string;
  locale?: string;
}) {
  return request<UssdResponse>("/channels/ussd", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getCase(trackingNumber: string) {
  return request<CaseDetails>(`/cases/${encodeURIComponent(trackingNumber)}`);
}

export function listCases(
  tenantId = "tg",
  status?: string,
  serviceCode?: string,
) {
  const q = new URLSearchParams({ tenantId });
  if (status) q.set("status", status);
  if (serviceCode) q.set("serviceCode", serviceCode);
  return request<CaseSummary[]>(`/cases?${q.toString()}`);
}

export function listInbox(tenantId = "tg") {
  return listCases(tenantId, "in_review");
}

export function allowedTransitionsFor(status: string): string[] {
  const map: Record<string, string[]> = {
    awaiting_payment: ["cancelled"],
    in_review: ["incomplete", "ready", "rejected"],
    incomplete: ["in_review", "rejected", "cancelled"],
    ready: ["delivered", "closed"],
    delivered: ["closed"],
    rejected: ["closed", "in_review"],
  };
  return map[status] ?? [];
}

export function instructCase(
  trackingNumber: string,
  body: { toStatus: string; actor?: string; note?: string },
) {
  return request<CaseDetails>(
    `/cases/${encodeURIComponent(trackingNumber)}/instruct`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function loginInstructor(body: {
  tenantId: string;
  email: string;
  password: string;
}) {
  return request<{ accessToken: string; instructor: Instructor }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function meInstructor() {
  return request<Instructor>("/auth/me");
}

export type StaffMember = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
};

export function listStaff() {
  return request<StaffMember[]>("/auth/staff");
}

export function setStaffActive(id: string, active: boolean) {
  return request<StaffMember>(`/auth/staff/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function listNotifications(tenantId = "tg") {
  return request<
    Array<{
      id: string;
      recipient: string;
      body: string;
      status: string;
      createdAt: string;
    }>
  >(`/notifications?tenantId=${tenantId}`);
}

export function listTenants() {
  return request<TenantSummary[]>("/tenants");
}

export type ConnectorSelection = {
  tenantId: string;
  payment: { id: string; label: string; source: string };
  sms: { id: string; label: string; source: string };
};

export function getTenantConnectors(tenantId: string) {
  return request<ConnectorSelection>(
    `/connectors/${encodeURIComponent(tenantId)}`,
  );
}

export type ChannelResponse = UssdResponse & { channel?: string };

export function agentStep(body: {
  tenantId: string;
  phoneNumber: string;
  sessionId?: string;
  input?: string;
  locale?: string;
  agentName?: string;
}) {
  return request<ChannelResponse>("/channels/agent", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type DemoStats = {
  generatedAt: string;
  totals: { cases: number; sms: number; paymentsSucceeded: number };
  tenants: Array<{
    tenantId: string;
    countryCode: string;
    name: { fr: string; en?: string; ee?: string };
    casesTotal: number;
    smsTotal: number;
    paymentsSucceeded: number;
    byStatus: Record<string, number>;
    byService: Array<{ serviceCode: string; label: string; count: number }>;
    byChannel: Record<string, number>;
  }>;
};

export function getDemoStats(tenantId?: string) {
  const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
  return request<DemoStats>(`/stats/demo${q}`);
}
