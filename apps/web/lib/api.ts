const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export type CaseDetails = {
  id: string;
  trackingNumber: string;
  status: string;
  phoneNumber: string;
  feeAmount: number;
  feeCurrency: string;
  payload: Record<string, string>;
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
