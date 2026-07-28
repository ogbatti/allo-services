import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { CasesService } from "./cases.service";
import { CreateCaseDto, InstructCaseDto } from "./dto";

@Controller("cases")
export class CasesController {
  constructor(
    private readonly cases: CasesService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Query("tenantId") tenantId?: string,
    @Query("status") status?: string,
    @Query("serviceCode") serviceCode?: string,
  ) {
    return this.cases.list(tenantId, status, serviceCode);
  }

  @Get("inbox/:tenantId")
  inbox(@Param("tenantId") tenantId: string) {
    return this.cases.inbox(tenantId);
  }

  @Get(":trackingNumber")
  get(
    @Param("trackingNumber") trackingNumber: string,
    @Headers("authorization") authorization?: string,
  ) {
    let role: string | undefined;
    try {
      role = this.auth.requirePayload(authorization).role;
    } catch {
      role = undefined;
    }
    return this.cases.findByTrackingNumber(trackingNumber, role);
  }

  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.cases.create(dto);
  }

  @Patch(":trackingNumber/instruct")
  instructPatch(
    @Param("trackingNumber") trackingNumber: string,
    @Body() dto: InstructCaseDto,
    @Headers("authorization") authorization?: string,
  ) {
    const user = this.auth.requireRole(authorization, "instructor");
    return this.cases.instruct(
      trackingNumber,
      {
        ...dto,
        actor: dto.actor?.trim() || user.name,
      },
      user.role,
    );
  }

  @Post(":trackingNumber/instruct")
  instructPost(
    @Param("trackingNumber") trackingNumber: string,
    @Body() dto: InstructCaseDto,
    @Headers("authorization") authorization?: string,
  ) {
    const user = this.auth.requireRole(authorization, "instructor");
    return this.cases.instruct(
      trackingNumber,
      {
        ...dto,
        actor: dto.actor?.trim() || user.name,
      },
      user.role,
    );
  }
}
