const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
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
