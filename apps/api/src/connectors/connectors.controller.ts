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
      whatsapp: this.registry.listWhatsapp(),
      voice: this.registry.listVoice(),
      tenants: this.tenants.list().map((t) => this.registry.resolveForTenant(t.id)),
      note: {
        fr: "Remplacez stub-* par un SDK opérateur / BSP derrière la même interface.",
        en: "Replace stub-* with a real operator / BSP SDK behind the same interface.",
      },
    };
  }

  @Get(":tenantId")
  forTenant(@Param("tenantId") tenantId: string) {
    return this.registry.resolveForTenant(tenantId);
  }
}
