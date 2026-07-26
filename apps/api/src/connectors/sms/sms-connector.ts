export type SmsSendRequest = {
  tenantId: string;
  senderId: string;
  recipient: string;
  body: string;
  caseId?: string;
};

export type SmsSendResult = {
  provider: string;
  status: "queued" | "sent" | "failed";
  externalRef?: string;
  costEstimate?: number;
  rawMessage?: string;
};

/** Swappable SMS gateway. */
export interface SmsConnector {
  readonly id: string;
  readonly label: string;
  send(request: SmsSendRequest): Promise<SmsSendResult>;
}

export const SMS_CONNECTORS = Symbol("SMS_CONNECTORS");
