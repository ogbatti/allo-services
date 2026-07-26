import { Injectable, Logger } from "@nestjs/common";
import type {
  PaymentChargeRequest,
  PaymentChargeResult,
  PaymentConnector,
} from "./payment-connector";

/** Default demo connector — always succeeds instantly. */
@Injectable()
export class SimulatorPaymentConnector implements PaymentConnector {
  readonly id = "simulator";
  readonly label = "Payment simulator (demo)";
  private readonly logger = new Logger(SimulatorPaymentConnector.name);

  async charge(request: PaymentChargeRequest): Promise<PaymentChargeResult> {
    const externalRef = `SIM-${Date.now()}`;
    this.logger.log(
      `[PAY-SIM] case=${request.trackingNumber} amount=${request.amount} ${request.currency} phone=${request.phoneNumber}`,
    );
    return {
      provider: this.id,
      status: "succeeded",
      externalRef,
      rawMessage: "Simulated mobile-money charge succeeded",
    };
  }
}
