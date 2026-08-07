import type { Session } from "next-auth";

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN", message?: string) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

type AccessLevel = "MANAGE" | "VIEW" | "NONE";

/**
 * Regra central de acesso a agenda de médico:
 * - médico: MANAGE na própria agenda, VIEW (somente leitura) na do outro médico
 * - secretário: MANAGE apenas na agenda do médico ao qual está vinculado
 */
function getDoctorAccessLevel(user: Session["user"], targetDoctorId: string): AccessLevel {
  if (user.role === "DOCTOR") {
    return user.id === targetDoctorId ? "MANAGE" : "VIEW";
  }
  if (user.role === "SECRETARY") {
    return user.linkedDoctorId === targetDoctorId ? "MANAGE" : "NONE";
  }
  return "NONE";
}

export function assertCanManageDoctorAgenda(session: Session | null, doctorId: string) {
  if (!session) throw new AuthError("UNAUTHENTICATED");
  if (getDoctorAccessLevel(session.user, doctorId) !== "MANAGE") {
    throw new AuthError("FORBIDDEN", "Você não tem permissão para editar a agenda deste médico.");
  }
}

export function assertCanViewDoctorAgenda(session: Session | null, doctorId: string) {
  if (!session) throw new AuthError("UNAUTHENTICATED");
  if (getDoctorAccessLevel(session.user, doctorId) === "NONE") {
    throw new AuthError("FORBIDDEN", "Você não tem permissão para ver a agenda deste médico.");
  }
}

export function assertIsAdmin(session: Session | null) {
  if (!session) throw new AuthError("UNAUTHENTICATED");
  if (!session.user.isAdmin) {
    throw new AuthError("FORBIDDEN", "Ação restrita a administradores.");
  }
}

/** IDs de médicos que o usuário logado pode pelo menos visualizar. */
export function getViewableDoctorIds(session: Session, allDoctorIds: string[]): string[] {
  if (session.user.role === "DOCTOR") return allDoctorIds;
  if (session.user.linkedDoctorId) return [session.user.linkedDoctorId];
  return [];
}
