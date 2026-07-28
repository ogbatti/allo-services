import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { roleAtLeast, type StaffRole } from "@allo/shared";
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
      if (!demo.tenantId || demo.tenantId.includes("...")) continue;
      const email = demo.email.trim().toLowerCase();
      if (!email.includes("@") || email.includes("...")) continue;

      const existing = await this.prisma.instructor.findUnique({
        where: {
          tenantId_email: { tenantId: demo.tenantId, email },
        },
      });
      const role = demo.role ?? "instructor";
      if (!existing) {
        await this.prisma.instructor.create({
          data: {
            tenantId: demo.tenantId,
            email,
            name: demo.name,
            role,
            passwordHash: hashPassword(demo.password),
            active: true,
          },
        });
      } else if (existing.role !== role || existing.name !== demo.name) {
        await this.prisma.instructor.update({
          where: { id: existing.id },
          data: { role, name: demo.name },
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

  requireRole(authorization: string | undefined, minimum: StaffRole) {
    const payload = this.requirePayload(authorization);
    if (!roleAtLeast(payload.role, minimum)) {
      throw new ForbiddenException({
        fr: `Rôle insuffisant (requis: ${minimum})`,
        en: `Insufficient role (required: ${minimum})`,
      });
    }
    return payload;
  }

  async listStaff(tenantId: string) {
    const rows = await this.prisma.instructor.findMany({
      where: { tenantId },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      email: r.email,
      name: r.name,
      role: r.role,
      active: r.active,
    }));
  }

  async setStaffActive(
    actorTenantId: string,
    staffId: string,
    active: boolean,
  ) {
    const target = await this.prisma.instructor.findUnique({
      where: { id: staffId },
    });
    if (!target || target.tenantId !== actorTenantId) {
      throw new ForbiddenException({
        fr: "Agent hors de votre tenant",
        en: "Staff outside your tenant",
      });
    }
    return this.prisma.instructor.update({
      where: { id: staffId },
      data: { active },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });
  }

  private loadSeedInstructors(): SeedInstructor[] {
    const dir = join(resolveConfigDir(), "instructors");
    if (!existsSync(dir)) return [];
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
    const all: SeedInstructor[] = [];
    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(raw) as SeedInstructor[] | SeedInstructor;
      if (Array.isArray(parsed)) all.push(...parsed);
      else all.push(parsed);
    }
    return all;
  }
}
