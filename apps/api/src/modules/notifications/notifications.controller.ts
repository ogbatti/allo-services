import { Controller, Get, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query("tenantId") tenantId?: string) {
    return this.notifications.list(tenantId);
  }
}
