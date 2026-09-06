"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OtpFlow } from "@/components/auth/OtpFlow";
import { getMe } from "@/lib/auth";

/**
 * Standalone sign-in screen — the same three-step OTP flow the contextual
 * sheet uses, rendered inline in a centered card. Already-signed-in visitors
 * are bounced straight to /account.
 */
export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    void getMe().then((res) => {
      if (res.ok) router.replace("/account");
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[68vh] w-full max-w-[440px] items-center px-4 py-10">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[1.2px] text-gold">
          Tapa · Account
        </p>
        <OtpFlow
          context="signin"
          onSuccess={() => router.push("/account")}
          onDismiss={() => router.push("/")}
        />
      </div>
    </main>
  );
}
