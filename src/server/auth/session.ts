import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export function getAuthSession() {
  return getServerSession(authOptions);
}
