import { Module } from "@nestjs/common";
import { JourneysModule } from "../journeys/journeys.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TenantsModule } from "../tenants/tenants.module";
import { CasesController } from "./cases.controller";
import { CasesService } from "./cases.service";

@Module({
  imports: [TenantsModule, JourneysModule, NotificationsModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
