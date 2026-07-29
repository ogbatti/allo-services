export type VoiceCallRequest = {
  tenantId: string;
  fromNumber: string;
  recipient: string;
  /** IVR / TTS script or prompt identifier */
  script: string;
  caseId?: string;
};

export type VoiceCallResult = {
  provider: string;
  status: "queued" | "sent" | "failed";
  externalRef?: string;
  costEstimate?: number;
  rawMessage?: string;
};

/** Swappable voice / IVR gateway. */
export interface VoiceConnector {
  readonly id: string;
  readonly label: string;
  call(request: VoiceCallRequest): Promise<VoiceCallResult>;
}

export const VOICE_CONNECTORS = Symbol("VOICE_CONNECTORS");
