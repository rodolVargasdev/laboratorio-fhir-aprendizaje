import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
    } & DefaultSession["user"];
  }

  interface User {
    rol?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: string;
  }
}
