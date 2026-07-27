import { Body, Controller, Post } from "@nestjs/common";
import { ChannelSessionDto } from "./dto";
import { UssdService } from "./ussd.service";

/** Community agent desk — same journeys as USSD, channel=agent. */
@Controller("channels/agent")
export class AgentController {
  constructor(private readonly sessions: UssdService) {}

  @Post()
  handle(@Body() dto: ChannelSessionDto) {
    return this.sessions.handle({
      ...dto,
      channel: "agent",
    });
  }
}
