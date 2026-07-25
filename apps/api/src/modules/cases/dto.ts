import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateCaseDto {
  @IsString()
  @MinLength(2)
  tenantId!: string;

  @IsString()
  journeyId!: string;

  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phoneNumber!: string;

  @IsOptional()
  @IsIn(["fr", "ee", "en"])
  locale?: "fr" | "ee" | "en";

  @IsOptional()
  @IsIn(["ussd", "voice", "sms", "whatsapp", "web", "agent"])
  channel?: "ussd" | "voice" | "sms" | "whatsapp" | "web" | "agent";

  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;
}

export class InstructCaseDto {
  @IsIn([
    "incomplete",
    "in_review",
    "ready",
    "delivered",
    "rejected",
    "closed",
  ])
  toStatus!:
    | "incomplete"
    | "in_review"
    | "ready"
    | "delivered"
    | "rejected"
    | "closed";

  @IsString()
  @MinLength(2)
  actor!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
