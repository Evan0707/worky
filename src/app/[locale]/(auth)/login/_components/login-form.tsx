"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Mail, Chrome, Loader2, ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsEmailLoading(true);
    setError(null);

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(t("login.errors.sendFailed"));
      } else {
        setEmailSent(true);
      }
    } catch {
      setError(t("login.errors.generic"));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md animate-scale-in mx-auto">
        <CardContent className="pt-6 space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
            <Mail className="h-8 w-8 text-brand" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("login.checkEmail.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("login.checkEmail.description", { email })}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setEmailSent(false)}
            className="mt-2 text-brand hover:text-brand-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("login.emailLabel")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto border-black/[0.06] dark:border-white/[0.06] bg-white/70 dark:bg-[#111]/70 backdrop-blur-xl shadow-2xl">
      <CardContent className="p-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Google Sign In — first for better UX */}
        {/* <Button
          variant="outline"
          className="w-full h-11 bg-white hover:bg-neutral-50 dark:bg-black/50 dark:hover:bg-white/5 border-black/10 dark:border-white/10"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {t("login.googleButton")}
        </Button> */}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/10 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#f0f0f0] dark:bg-[#131313] px-2 text-neutral-500 font-medium">
              {t("login.divider")}
            </span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">{t("login.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEmailLoading}
                autoComplete="email"
                className="pl-10 h-11 bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-11 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-medium transition-all"
            disabled={isEmailLoading || !email.trim()}
          >
            {isEmailLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {isEmailLoading ? t("login.sending") : t("login.submitButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
