import { Injectable, Logger } from "@nestjs/common";
import type { SmsConnector, SmsSendRequest, SmsSendResult } from "./sms-connector";

/**
 * Fake SMS gateway stub.
 * Swap for a real aggregator (e.g. Twilio / local SMSC) behind this interface.
 */
@Injectable()
export class StubSmsConnector implements SmsConnector {
  readonly id = "stub-sms";
  readonly label = "Stub SMS gateway (fake operator)";
  private readonly logger = new Logger(StubSmsConnector.name);

  async send(request: SmsSendRequest): Promise<SmsSendResult> {
    await new Promise((r) => setTimeout(r, 40));
    const externalRef = `STUB-SMS-${Date.now().toString(36)}`;
    this.logger.log(
      `[SMS-STUB] tenant=${request.tenantId} to=${request.recipient} from=${request.senderId} ref=${externalRef} chars=${request.body.length}`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef,
      costEstimate: 12,
      rawMessage: "Stub SMS gateway: accepted (no real SMS sent)",
    };
  }
}
