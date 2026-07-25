import { Module } from "@nestjs/common";
import { CasesModule } from "../cases/cases.module";
import { JourneysModule } from "../journeys/journeys.module";
import { PaymentsModule } from "../payments/payments.module";
import { TenantsModule } from "../tenants/tenants.module";
import { UssdController } from "./ussd.controller";
import { UssdService } from "./ussd.service";

@Module({
  imports: [TenantsModule, JourneysModule, CasesModule, PaymentsModule],
  controllers: [UssdController],
  providers: [UssdService],
})
export class ChannelsModule {}
