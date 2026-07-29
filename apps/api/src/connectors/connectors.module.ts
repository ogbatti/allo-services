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
import { VOICE_CONNECTORS } from "./voice/voice-connector";
import { SimulatorVoiceConnector } from "./voice/simulator.voice-connector";
import { StubVoiceConnector } from "./voice/stub-voice.voice-connector";
import { WHATSAPP_CONNECTORS } from "./whatsapp/whatsapp-connector";
import { SimulatorWhatsappConnector } from "./whatsapp/simulator.whatsapp-connector";
import { StubWhatsappConnector } from "./whatsapp/stub-whatsapp.whatsapp-connector";

@Global()
@Module({
  imports: [TenantsModule],
  controllers: [ConnectorsController],
  providers: [
    SimulatorPaymentConnector,
    StubMomoPaymentConnector,
    SimulatorSmsConnector,
    StubSmsConnector,
    SimulatorWhatsappConnector,
    StubWhatsappConnector,
    SimulatorVoiceConnector,
    StubVoiceConnector,
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
    {
      provide: WHATSAPP_CONNECTORS,
      useFactory: (
        sim: SimulatorWhatsappConnector,
        stub: StubWhatsappConnector,
      ) => [sim, stub],
      inject: [SimulatorWhatsappConnector, StubWhatsappConnector],
    },
    {
      provide: VOICE_CONNECTORS,
      useFactory: (sim: SimulatorVoiceConnector, stub: StubVoiceConnector) => [
        sim,
        stub,
      ],
      inject: [SimulatorVoiceConnector, StubVoiceConnector],
    },
    ConnectorRegistry,
  ],
  exports: [ConnectorRegistry],
})
export class ConnectorsModule {}
