import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export type SessionChannel = "ussd" | "agent" | "whatsapp" | "voice";

export const SESSION_CHANNELS: SessionChannel[] = [
  "ussd",
  "agent",
  "whatsapp",
  "voice",
];

export function normalizeSessionChannel(
  channel?: string | null,
): SessionChannel {
  if (
    channel === "agent" ||
    channel === "whatsapp" ||
    channel === "voice" ||
    channel === "ussd"
  ) {
    return channel;
  }
  return "ussd";
}

export class ChannelSessionDto {
  @IsString()
  @MinLength(2)
  tenantId!: string;

  /** Citizen MSISDN (usager), not the agent's phone */
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  /** Empty or undefined = first screen / session start */
  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsIn(["fr", "ee", "en"])
  locale?: "fr" | "ee" | "en";

  @IsOptional()
  @IsIn(SESSION_CHANNELS)
  channel?: SessionChannel;

  /** Display name of the community agent (stored on the case payload) */
  @IsOptional()
  @IsString()
  @MinLength(2)
  agentName?: string;
}

/** @deprecated Use ChannelSessionDto — kept as alias for USSD clients */
export class UssdRequestDto extends ChannelSessionDto {}
