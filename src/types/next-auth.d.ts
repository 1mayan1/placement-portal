/**
 * NextAuth type extensions.
 *
 * By default, NextAuth's Session only has { name, email, image }.
 * We add "id" and "role" so every server/client component can check
 * session.user.role without extra database lookups.
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "student" | "tpo";
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: "student" | "tpo";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "student" | "tpo";
  }
}
