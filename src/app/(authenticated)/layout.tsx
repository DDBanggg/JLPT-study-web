"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProgramDto } from "@/components/layout/TopProgressHeader";
import { AlertTriangleIcon } from "@/components/common/Icons";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/program")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        const data = await res.json();
        return { status: res.status, data };
      })
      .then((result) => {
        if (!isMounted || !result) return;
        const { status, data } = result;

        if (status === 200 && data?.ok === true) {
          if (data?.data?.configured === false) {
            router.replace("/setup");
            return;
          }

          if (data?.data?.configured === true) {
            setProgram(data.data.program || null);
            setIsLoading(false);
            return;
          }
        }

        const msg = data?.error?.message || "Không thể tải thông tin chương trình học.";
        setErrorMessage(msg);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <AppShell program={null}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-white border border-slate-200 p-6" />
        </div>
      </AppShell>
    );
  }

  if (errorMessage) {
    return (
      <AppShell program={null}>
        <div
          data-testid="program-error-state"
          className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center max-w-lg mx-auto mt-8"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-red-800">Không thể tải dữ liệu</h2>
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </AppShell>
    );
  }

  return <AppShell program={program}>{children}</AppShell>;
}
