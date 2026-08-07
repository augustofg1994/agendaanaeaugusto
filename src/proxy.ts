import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith("/admin") && !token?.isAdmin) {
      return NextResponse.redirect(new URL("/agenda", req.url));
    }
  },
  {
    pages: { signIn: "/login" },
  }
);

// Convite de UX apenas — cada Server Action revalida permissão de forma independente,
// já que uma action pode ser invocada diretamente sem passar pelo middleware.
export const config = {
  matcher: [
    "/((?!login|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
