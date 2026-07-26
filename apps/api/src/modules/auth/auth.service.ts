import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./password";
import { signToken, verifyToken } from "./token";

const DEMO_INSTRUCTORS = [
  {
    tenantId: "tg",
    email: "instructeur@lome.tg",
    name: "Agent Commune Lomé",
    password: "Demo2026!",
    role: "instructor",
  },
];

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const demo of DEMO_INSTRUCTORS) {
      const existing = await this.prisma.instructor.findUnique({
        where: {
          tenantId_email: { tenantId: demo.tenantId, email: demo.email },
        },
      });
      if (!existing) {
        await this.prisma.instructor.create({
          data: {
            tenantId: demo.tenantId,
            email: demo.email,
            name: demo.name,
            role: demo.role,
            passwordHash: hashPassword(demo.password),
            active: true,
          },
        });
      }
    }
  }

  async login(input: { tenantId: string; email: string; password: string }) {
    const instructor = await this.prisma.instructor.findUnique({
      where: {
        tenantId_email: {
          tenantId: input.tenantId,
          email: input.email.trim().toLowerCase(),
        },
      },
    });
    if (!instructor || !instructor.active) {
      throw new UnauthorizedException({
        fr: "Identifiants invalides",
        en: "Invalid credentials",
      });
    }
    if (!verifyPassword(input.password, instructor.passwordHash)) {
      throw new UnauthorizedException({
        fr: "Identifiants invalides",
        en: "Invalid credentials",
      });
    }

    const accessToken = signToken({
      sub: instructor.id,
      tenantId: instructor.tenantId,
      email: instructor.email,
      name: instructor.name,
      role: instructor.role,
    });

    return {
      accessToken,
      instructor: {
        id: instructor.id,
        tenantId: instructor.tenantId,
        email: instructor.email,
        name: instructor.name,
        role: instructor.role,
      },
    };
  }

  me(authorization?: string) {
    const payload = this.requirePayload(authorization);
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }

  requirePayload(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      throw new UnauthorizedException({
        fr: "Authentification requise",
        en: "Authentication required",
      });
    }
    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException({
        fr: "Session expirée ou jeton invalide",
        en: "Session expired or invalid token",
      });
    }
    return payload;
  }
}
