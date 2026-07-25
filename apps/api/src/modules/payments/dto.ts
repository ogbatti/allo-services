import { IsOptional, IsString, Matches, MinLength } from "class-validator";

export class PayCaseDto {
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  idempotencyKey?: string;
}
