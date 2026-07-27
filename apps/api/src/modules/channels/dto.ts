import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

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
  @IsIn(["ussd", "agent"])
  channel?: "ussd" | "agent";

  /** Display name of the community agent (stored on the case payload) */
  @IsOptional()
  @IsString()
  @MinLength(2)
  agentName?: string;
}

/** @deprecated Use ChannelSessionDto — kept as alias for USSD clients */
export class UssdRequestDto extends ChannelSessionDto {}
