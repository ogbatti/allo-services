import { Injectable, Logger } from "@nestjs/common";
import type {
  VoiceCallRequest,
  VoiceCallResult,
  VoiceConnector,
} from "./voice-connector";

@Injectable()
export class SimulatorVoiceConnector implements VoiceConnector {
  readonly id = "simulator";
  readonly label = "Voice IVR simulator (demo log)";
  private readonly logger = new Logger(SimulatorVoiceConnector.name);

  async call(request: VoiceCallRequest): Promise<VoiceCallResult> {
    const externalRef = `VOICE-SIM-${Date.now().toString(36)}`;
    this.logger.log(
      `[VOICE-SIM] tenant=${request.tenantId} to=${request.recipient} from=${request.fromNumber}`,
    );
    return {
      provider: this.id,
      status: "sent",
      externalRef,
      costEstimate: 0,
      rawMessage: "Voice simulator: call logged only",
    };
  }
}
