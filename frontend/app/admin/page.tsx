"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /admin lands on the articles workbench. */
export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/articles");
  }, [router]);
  return null;
}
