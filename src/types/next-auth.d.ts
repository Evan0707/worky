import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      plan: "FREE" | "PRO";
    } & DefaultSession["user"];
  }

  interface User {
    plan: "FREE" | "PRO";
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    plan: "FREE" | "PRO";
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    plan: "FREE" | "PRO";
  }
}
