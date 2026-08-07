import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";

export default async function AgendaRootPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { defaultDoctorId } = await getDoctorScope(session);
  if (!defaultDoctorId) redirect("/patients");

  redirect(`/agenda/${defaultDoctorId}`);
}
