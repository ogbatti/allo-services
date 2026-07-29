export type WhatsappSendRequest = {
  tenantId: string;
  senderId: string;
  recipient: string;
  body: string;
  caseId?: string;
};

export type WhatsappSendResult = {
  provider: string;
  status: "queued" | "sent" | "failed";
  externalRef?: string;
  costEstimate?: number;
  rawMessage?: string;
};

/** Swappable WhatsApp Business API gateway. */
export interface WhatsappConnector {
  readonly id: string;
  readonly label: string;
  send(request: WhatsappSendRequest): Promise<WhatsappSendResult>;
}

export const WHATSAPP_CONNECTORS = Symbol("WHATSAPP_CONNECTORS");
