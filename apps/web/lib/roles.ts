export const ROLE_LABELS_FR: Record<string, string> = {
  instructor: "Instructeur",
  supervisor: "Superviseur",
  tenant_admin: "Admin tenant",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS_FR[role] ?? role;
}

export function isSupervisorPlus(role: string): boolean {
  return role === "supervisor" || role === "tenant_admin";
}

export function isTenantAdmin(role: string): boolean {
  return role === "tenant_admin";
}
