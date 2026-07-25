import { Controller, Get, Param } from "@nestjs/common";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  list() {
    return this.tenants.list();
  }

  @Get(":tenantId")
  get(@Param("tenantId") tenantId: string) {
    return this.tenants.get(tenantId);
  }
}
