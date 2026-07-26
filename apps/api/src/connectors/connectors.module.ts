import { Global, Module } from "@nestjs/common";
import { TenantsModule } from "../modules/tenants/tenants.module";
import { ConnectorRegistry } from "./connector.registry";
import { ConnectorsController } from "./connectors.controller";
import { PAYMENT_CONNECTORS } from "./payment/payment-connector";
import { SimulatorPaymentConnector } from "./payment/simulator.payment-connector";
import { StubMomoPaymentConnector } from "./payment/stub-momo.payment-connector";
import { SMS_CONNECTORS } from "./sms/sms-connector";
import { SimulatorSmsConnector } from "./sms/simulator.sms-connector";
import { StubSmsConnector } from "./sms/stub-sms.sms-connector";

@Global()
@Module({
  imports: [TenantsModule],
  controllers: [ConnectorsController],
  providers: [
    SimulatorPaymentConnector,
    StubMomoPaymentConnector,
    SimulatorSmsConnector,
    StubSmsConnector,
    {
      provide: PAYMENT_CONNECTORS,
      useFactory: (
        sim: SimulatorPaymentConnector,
        stub: StubMomoPaymentConnector,
      ) => [sim, stub],
      inject: [SimulatorPaymentConnector, StubMomoPaymentConnector],
    },
    {
      provide: SMS_CONNECTORS,
      useFactory: (sim: SimulatorSmsConnector, stub: StubSmsConnector) => [
        sim,
        stub,
      ],
      inject: [SimulatorSmsConnector, StubSmsConnector],
    },
    ConnectorRegistry,
  ],
  exports: [ConnectorRegistry],
})
export class ConnectorsModule {}
