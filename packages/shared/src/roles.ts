/** Back-office staff roles / Rôles back-office */

export const STAFF_ROLES = [
  "instructor",
  "supervisor",
  "tenant_admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const RANK: Record<StaffRole, number> = {
  instructor: 1,
  supervisor: 2,
  tenant_admin: 3,
};

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function roleAtLeast(role: string, minimum: StaffRole): boolean {
  if (!isStaffRole(role)) return false;
  return RANK[role] >= RANK[minimum];
}

export const ROLE_LABELS: Record<StaffRole, { fr: string; en: string }> = {
  instructor: { fr: "Instructeur", en: "Instructor" },
  supervisor: { fr: "Superviseur", en: "Supervisor" },
  tenant_admin: { fr: "Admin tenant", en: "Tenant admin" },
};

/**
 * Transitions allowed per role.
 * Higher roles inherit broader powers (close, reopen).
 */
export function transitionsForRole(
  status: string,
  role: string,
): string[] {
  const base: Record<string, string[]> = {
    awaiting_payment: ["cancelled"],
    in_review: ["incomplete", "ready", "rejected"],
    incomplete: ["in_review", "rejected", "cancelled"],
    ready: ["delivered", "closed"],
    delivered: ["closed"],
    rejected: ["closed", "in_review"],
  };

  const instructor: Record<string, string[]> = {
    awaiting_payment: [],
    in_review: ["incomplete", "ready", "rejected"],
    incomplete: ["in_review", "rejected"],
    ready: ["delivered"],
    delivered: [],
    rejected: [],
  };

  if (roleAtLeast(role, "supervisor")) {
    return base[status] ?? [];
  }
  return instructor[status] ?? [];
}
