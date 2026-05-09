/**
 * NextAuth route handler.
 * Configuration lives in src/lib/auth.ts — imported here and by any API
 * route that calls getServerSession().
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
