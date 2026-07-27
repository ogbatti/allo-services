import { Module } from "@nestjs/common";
import { ConnectorsModule } from "./connectors/connectors.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CasesModule } from "./modules/cases/cases.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { HealthModule } from "./modules/health/health.module";
import { JourneysModule } from "./modules/journeys/journeys.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { StatsModule } from "./modules/stats/stats.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    ConnectorsModule,
    AuthModule,
    HealthModule,
    JourneysModule,
    CasesModule,
    PaymentsModule,
    NotificationsModule,
    ChannelsModule,
    StatsModule,
  ],
})
export class AppModule {}
