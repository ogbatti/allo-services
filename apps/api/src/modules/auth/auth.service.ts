import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveConfigDir } from "../../common/paths";
import { PrismaService } from "../../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./password";
import { signToken, verifyToken } from "./token";

type SeedInstructor = {
  tenantId: string;
  email: string;
  name: string;
  password: string;
  role?: string;
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const demo of this.loadSeedInstructors()) {
      const email = demo.email.trim().toLowerCase();
      const existing = await this.prisma.instructor.findUnique({
        where: {
          tenantId_email: { tenantId: demo.tenantId, email },
        },
      });
      if (!existing) {
        await this.prisma.instructor.create({
          data: {
            tenantId: demo.tenantId,
            email,
            name: demo.name,
            role: demo.role ?? "instructor",
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

  private loadSeedInstructors(): SeedInstructor[] {
    const dir = join(resolveConfigDir(), "instructors");
    if (!existsSync(dir)) return [];
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
    const all: SeedInstructor[] = [];
    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf8");
      const parsed = JSON.parse(raw) as SeedInstructor[] | SeedInstructor;
      if (Array.isArray(parsed)) all.push(...parsed);
      else all.push(parsed);
    }
    return all;
  }
}
