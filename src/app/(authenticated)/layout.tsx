"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProgramDto } from "@/components/layout/TopProgressHeader";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProgram() {
      try {
        const res = await fetch("/api/program");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (!data?.ok || !data?.data?.configured) {
          router.replace("/setup");
          return;
        }

        if (isMounted) {
          setProgram(data.data.program || null);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgram();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <AppShell program={null}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-white border border-slate-200 p-6" />
        </div>
      </AppShell>
    );
  }

  return <AppShell program={program}>{children}</AppShell>;
}
