import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { IsBoolean, IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsString()
  @MinLength(2)
  tenantId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class SetActiveDto {
  @IsBoolean()
  active!: boolean;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    return this.auth.me(authorization);
  }

  /** Supervisors and tenant admins can list staff for their tenant. */
  @Get("staff")
  listStaff(@Headers("authorization") authorization?: string) {
    const user = this.auth.requireRole(authorization, "supervisor");
    return this.auth.listStaff(user.tenantId);
  }

  /** Tenant admins can activate / deactivate staff accounts. */
  @Patch("staff/:id")
  setActive(
    @Param("id") id: string,
    @Body() dto: SetActiveDto,
    @Headers("authorization") authorization?: string,
  ) {
    const user = this.auth.requireRole(authorization, "tenant_admin");
    return this.auth.setStaffActive(user.tenantId, id, dto.active);
  }
}
