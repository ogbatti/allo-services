import { Injectable, Logger } from "@nestjs/common";
import type { SmsConnector, SmsSendRequest, SmsSendResult } from "./sms-connector";

/** Default demo connector — logs and marks as sent. */
@Injectable()
export class SimulatorSmsConnector implements SmsConnector {
  readonly id = "simulator";
  readonly label = "SMS simulator (demo outbox)";
  private readonly logger = new Logger(SimulatorSmsConnector.name);

  async send(request: SmsSendRequest): Promise<SmsSendResult> {
    this.logger.log(
      `[SMS-SIM] to=${request.recipient} sender=${request.senderId} body="${request.body}"`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef: `SIM-SMS-${Date.now()}`,
      costEstimate: 15,
      rawMessage: "Simulated SMS delivered to outbox",
    };
  }
}
