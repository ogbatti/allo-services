import { Injectable, Logger } from "@nestjs/common";
import type {
  PaymentChargeRequest,
  PaymentChargeResult,
  PaymentConnector,
} from "./payment-connector";

/**
 * Fake mobile-money aggregator stub.
 * Replace this class with a real operator SDK behind the same interface.
 */
@Injectable()
export class StubMomoPaymentConnector implements PaymentConnector {
  readonly id = "stub-momo";
  readonly label = "Stub MoMo aggregator (fake operator)";
  private readonly logger = new Logger(StubMomoPaymentConnector.name);

  async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    // Simulate network latency of a real PSP hop
    await new Promise((r) => setTimeout(r, 80));
    const externalRef = `STUB-MM-${request.idempotencyKey.slice(0, 8).toUpperCase()}-${Date.now().toString(36)}`;
    this.logger.log(
      `[PAY-STUB-MOMO] tenant=${request.tenantId} case=${request.trackingNumber} amount=${request.amount} ${request.currency} msisdn=${request.phoneNumber} ref=${externalRef}`,
    );
    return {
      provider: this.id,
      status: "succeeded",
      externalRef,
      rawMessage: "Stub MoMo: accepted (no real money moved)",
    };
  }
}
