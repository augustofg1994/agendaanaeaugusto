import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";

export default async function RootPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  redirect("/agenda");
}
