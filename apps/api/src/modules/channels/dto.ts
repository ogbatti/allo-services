import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UssdRequestDto {
  @IsString()
  @MinLength(2)
  tenantId!: string;

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
}
