export type PaymentChargeRequest = {
  tenantId: string;
  caseId: string;
  trackingNumber: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  idempotencyKey: string;
};

export type PaymentChargeResult = {
  provider: string;
  status: "succeeded" | "failed" | "pending";
  externalRef: string;
  rawMessage?: string;
};

/** Swappable mobile-money / payment aggregator. */
export interface PaymentConnector {
  readonly id: string;
  readonly label: string;
  charge(request: PaymentChargeRequest): Promise<PaymentChargeResult>;
}

export const PAYMENT_CONNECTORS = Symbol("PAYMENT_CONNECTORS");
