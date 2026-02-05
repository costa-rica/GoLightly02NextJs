"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api/auth";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const runVerification = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(response.message || "Email verified successfully.");
        setTimeout(() => {
          router.push("/?login=1");
        }, 2000);
      } catch (err: any) {
        const apiMessage = err?.response?.data?.error?.message || "Verification failed.";
        setStatus("error");
        setMessage(apiMessage);
      }
    };

    runVerification();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-calm-50 via-white to-primary-50">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16">
        <div className="rounded-3xl border border-calm-200/70 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-calm-400">Email verification</p>
          <h1 className="mt-3 text-3xl font-display font-semibold text-calm-900">
            {status === "success" ? "Verified" : status === "error" ? "Verification failed" : "Please wait"}
          </h1>
          <p className="mt-3 text-sm text-calm-600">{message}</p>

          {status === "success" && (
            <p className="mt-4 text-xs text-calm-500">
              Redirecting you to login...
            </p>
          )}

          {status === "error" && (
            <div className="mt-6 space-y-3 text-sm">
              <Link
                href="/?register=1"
                className="inline-flex items-center justify-center rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-300"
              >
                Request new verification email
              </Link>
              <div>
                <Link
                  href="/?login=1"
                  className="text-xs font-semibold text-calm-600 hover:text-primary-600"
                >
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
