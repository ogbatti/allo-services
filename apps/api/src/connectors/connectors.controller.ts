import { Controller, Get, Param } from "@nestjs/common";
import { TenantsService } from "../modules/tenants/tenants.service";
import { ConnectorRegistry } from "./connector.registry";

@Controller("connectors")
export class ConnectorsController {
  constructor(
    private readonly registry: ConnectorRegistry,
    private readonly tenants: TenantsService,
  ) {}

  @Get()
  catalog() {
    return {
      payment: this.registry.listPayment(),
      sms: this.registry.listSms(),
      tenants: this.tenants.list().map((t) => this.registry.resolveForTenant(t.id)),
      note: {
        fr: "Remplacez stub-momo / stub-sms par un SDK opérateur derrière la même interface.",
        en: "Replace stub-momo / stub-sms with a real operator SDK behind the same interface.",
      },
    };
  }

  @Get(":tenantId")
  forTenant(@Param("tenantId") tenantId: string) {
    return this.registry.resolveForTenant(tenantId);
  }
}
