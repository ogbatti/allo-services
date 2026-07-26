import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CasesService } from "./cases.service";
import { CreateCaseDto, InstructCaseDto } from "./dto";

@Controller("cases")
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  list(
    @Query("tenantId") tenantId?: string,
    @Query("status") status?: string,
  ) {
    return this.cases.list(tenantId, status);
  }

  @Get("inbox/:tenantId")
  inbox(@Param("tenantId") tenantId: string) {
    return this.cases.inbox(tenantId);
  }

  @Get(":trackingNumber")
  get(@Param("trackingNumber") trackingNumber: string) {
    return this.cases.findByTrackingNumber(trackingNumber);
  }

  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.cases.create(dto);
  }

  @Patch(":trackingNumber/instruct")
  instructPatch(
    @Param("trackingNumber") trackingNumber: string,
    @Body() dto: InstructCaseDto,
  ) {
    return this.cases.instruct(trackingNumber, dto);
  }

  /** POST alias — some clients/proxies handle PATCH poorly */
  @Post(":trackingNumber/instruct")
  instructPost(
    @Param("trackingNumber") trackingNumber: string,
    @Body() dto: InstructCaseDto,
  ) {
    return this.cases.instruct(trackingNumber, dto);
  }
}
