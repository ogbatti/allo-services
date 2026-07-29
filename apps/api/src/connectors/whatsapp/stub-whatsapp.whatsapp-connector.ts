import { Injectable, Logger } from "@nestjs/common";
import type {
  WhatsappConnector,
  WhatsappSendRequest,
  WhatsappSendResult,
} from "./whatsapp-connector";

/**
 * Fake WhatsApp Business API stub.
 * Swap for Meta Cloud API / BSP behind this interface.
 */
@Injectable()
export class StubWhatsappConnector implements WhatsappConnector {
  readonly id = "stub-whatsapp";
  readonly label = "Stub WhatsApp (fake BSP)";
  private readonly logger = new Logger(StubWhatsappConnector.name);

  async send(request: WhatsappSendRequest): Promise<WhatsappSendResult> {
    await new Promise((r) => setTimeout(r, 40));
    const externalRef = `STUB-WA-${Date.now().toString(36)}`;
    this.logger.log(
      `[WA-STUB] tenant=${request.tenantId} to=${request.recipient} from=${request.senderId} ref=${externalRef}`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef,
      costEstimate: 8,
      rawMessage: "Stub WhatsApp: accepted (no real message sent)",
    };
  }
}
