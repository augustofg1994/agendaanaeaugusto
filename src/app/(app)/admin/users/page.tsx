import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { listAllUsers, listDoctors } from "@/server/queries/users";
import { UsersManager } from "./users-manager";

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  if (!session?.user.isAdmin) redirect("/agenda");

  const [users, doctors] = await Promise.all([listAllUsers(), listDoctors({ onlyActive: false })]);

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isAdmin: u.isAdmin,
    active: u.active,
    linkedDoctorId: u.linkedDoctorId,
    linkedDoctorName: u.linkedDoctor?.name ?? null,
  }));

  const doctorOptions = doctors.map((d) => ({ id: d.id, name: d.name, active: d.active }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie médicos e secretários, vínculos e senhas.
        </p>
      </div>
      <UsersManager
        users={serialized}
        doctorOptions={doctorOptions}
        currentUserId={session.user.id}
      />
    </div>
  );
}
