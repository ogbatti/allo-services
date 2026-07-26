import { Inject, Injectable } from "@nestjs/common";
import { TenantsService } from "../modules/tenants/tenants.service";
import {
  PAYMENT_CONNECTORS,
  type PaymentConnector,
} from "./payment/payment-connector";
import { SMS_CONNECTORS, type SmsConnector } from "./sms/sms-connector";

@Injectable()
export class ConnectorRegistry {
  private readonly paymentById: Map<string, PaymentConnector>;
  private readonly smsById: Map<string, SmsConnector>;

  constructor(
    @Inject(PAYMENT_CONNECTORS) paymentConnectors: PaymentConnector[],
    @Inject(SMS_CONNECTORS) smsConnectors: SmsConnector[],
    private readonly tenants: TenantsService,
  ) {
    this.paymentById = new Map(paymentConnectors.map((c) => [c.id, c]));
    this.smsById = new Map(smsConnectors.map((c) => [c.id, c]));
  }

  listPayment() {
    return [...this.paymentById.values()].map((c) => ({
      id: c.id,
      label: c.label,
    }));
  }

  listSms() {
    return [...this.smsById.values()].map((c) => ({
      id: c.id,
      label: c.label,
    }));
  }

  paymentForTenant(tenantId: string): PaymentConnector {
    const tenant = this.tenants.get(tenantId);
    const fromTenant = tenant.connectors?.payment;
    const fromEnv = process.env.PAYMENT_CONNECTOR;
    const id = fromTenant || fromEnv || "simulator";
    const connector = this.paymentById.get(id) ?? this.paymentById.get("simulator");
    if (!connector) {
      throw new Error("No payment connector registered");
    }
    return connector;
  }

  smsForTenant(tenantId: string): SmsConnector {
    const tenant = this.tenants.get(tenantId);
    const fromTenant = tenant.connectors?.sms;
    const fromEnv = process.env.SMS_CONNECTOR;
    const id = fromTenant || fromEnv || "simulator";
    const connector = this.smsById.get(id) ?? this.smsById.get("simulator");
    if (!connector) {
      throw new Error("No SMS connector registered");
    }
    return connector;
  }

  /** Active selection summary for demo / ops. */
  resolveForTenant(tenantId: string) {
    const payment = this.paymentForTenant(tenantId);
    const sms = this.smsForTenant(tenantId);
    const tenant = this.tenants.get(tenantId);
    return {
      tenantId,
      payment: {
        id: payment.id,
        label: payment.label,
        source: tenant.connectors?.payment
          ? "tenant"
          : process.env.PAYMENT_CONNECTOR
            ? "env"
            : "default",
      },
      sms: {
        id: sms.id,
        label: sms.label,
        source: tenant.connectors?.sms
          ? "tenant"
          : process.env.SMS_CONNECTOR
            ? "env"
            : "default",
      },
    };
  }
}
