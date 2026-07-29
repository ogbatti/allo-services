import { Injectable, Logger } from "@nestjs/common";
import type {
  VoiceCallRequest,
  VoiceCallResult,
  VoiceConnector,
} from "./voice-connector";

/**
 * Fake voice / IVR aggregator stub.
 * Swap for a real telephony provider (e.g. Asterisk / Twilio) behind this interface.
 */
@Injectable()
export class StubVoiceConnector implements VoiceConnector {
  readonly id = "stub-voice";
  readonly label = "Stub voice IVR (fake operator)";
  private readonly logger = new Logger(StubVoiceConnector.name);

  async call(request: VoiceCallRequest): Promise<VoiceCallResult> {
    await new Promise((r) => setTimeout(r, 50));
    const externalRef = `STUB-VOICE-${Date.now().toString(36)}`;
    this.logger.log(
      `[VOICE-STUB] tenant=${request.tenantId} to=${request.recipient} from=${request.fromNumber} ref=${externalRef} scriptChars=${request.script.length}`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef,
      costEstimate: 25,
      rawMessage: "Stub voice: call accepted (no real call placed)",
    };
  }
}
