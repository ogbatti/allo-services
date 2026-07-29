import { Injectable, Logger } from "@nestjs/common";
import type {
  WhatsappConnector,
  WhatsappSendRequest,
  WhatsappSendResult,
} from "./whatsapp-connector";

@Injectable()
export class SimulatorWhatsappConnector implements WhatsappConnector {
  readonly id = "simulator";
  readonly label = "WhatsApp simulator (demo log)";
  private readonly logger = new Logger(SimulatorWhatsappConnector.name);

  async send(request: WhatsappSendRequest): Promise<WhatsappSendResult> {
    const externalRef = `WA-SIM-${Date.now().toString(36)}`;
    this.logger.log(
      `[WA-SIM] tenant=${request.tenantId} to=${request.recipient} chars=${request.body.length}`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef,
      costEstimate: 0,
      rawMessage: "WhatsApp simulator: message logged only",
    };
  }
}
