import type { Session } from "next-auth";
import { listDoctors } from "@/server/queries/users";

export type DoctorScopeEntry = { id: string; name: string; access: "MANAGE" | "VIEW" };

/**
 * Para o usuário logado, retorna a lista de médicos que ele pode ao menos visualizar,
 * marcando quais ele pode gerenciar (MANAGE) — a própria agenda para médico, ou a do
 * médico vinculado para secretário — e o médico "padrão" a mostrar primeiro.
 */
export async function getDoctorScope(session: Session): Promise<{
  doctors: DoctorScopeEntry[];
  defaultDoctorId: string | null;
}> {
  const allDoctors = await listDoctors({ onlyActive: true });

  if (session.user.role === "DOCTOR") {
    const doctors = allDoctors.map((d) => ({
      id: d.id,
      name: d.name,
      access: (d.id === session.user.id ? "MANAGE" : "VIEW") as "MANAGE" | "VIEW",
    }));
    return { doctors, defaultDoctorId: session.user.id };
  }

  const linked = allDoctors.find((d) => d.id === session.user.linkedDoctorId);
  if (!linked) return { doctors: [], defaultDoctorId: null };

  return {
    doctors: [{ id: linked.id, name: linked.name, access: "MANAGE" }],
    defaultDoctorId: linked.id,
  };
}
