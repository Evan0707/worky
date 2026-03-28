import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import LoginForm from "./_components/login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte ChantierPro",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand dark:text-brand-400">
            ChantierPro
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gérez vos chantiers en toute simplicité
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En vous connectant, vous acceptez nos{" "}
          <a href="/cgu" className="underline hover:text-foreground">
            CGU
          </a>{" "}
          et notre{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </main>
  );
}
