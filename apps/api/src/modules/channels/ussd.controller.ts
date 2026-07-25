import { Body, Controller, Post } from "@nestjs/common";
import { UssdRequestDto } from "./dto";
import { UssdService } from "./ussd.service";

@Controller("channels/ussd")
export class UssdController {
  constructor(private readonly ussd: UssdService) {}

  @Post()
  handle(@Body() dto: UssdRequestDto) {
    return this.ussd.handle(dto);
  }
}
