import {
  Controller,
  Get,
  Header,
  Headers,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "../auth/auth.service";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Headers("authorization") authorization?: string,
    @Query("serviceCode") serviceCode?: string,
    @Query("toStatus") toStatus?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("actor") actor?: string,
  ) {
    const user = this.auth.requireRole(authorization, "supervisor");
    return this.audit.list({
      tenantId: user.tenantId,
      serviceCode,
      toStatus,
      from,
      to,
      actor,
    });
  }

  @Get("export")
  @Header("Cache-Control", "no-store")
  async export(
    @Headers("authorization") authorization: string | undefined,
    @Query("format") format: string | undefined,
    @Query("serviceCode") serviceCode: string | undefined,
    @Query("toStatus") toStatus: string | undefined,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Query("actor") actor: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = this.auth.requireRole(authorization, "supervisor");
    const filters = {
      tenantId: user.tenantId,
      serviceCode,
      toStatus,
      from,
      to,
      actor,
    };
    if ((format ?? "json") === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-${user.tenantId}.csv"`,
      );
      return this.audit.exportCsv(filters);
    }
    return this.audit.list(filters);
  }
}
