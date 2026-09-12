"use client";

import { useEffect, useState } from "react";

/**
 * Slim fixed banner shown only while the browser reports no network
 * connection. Fear-free wording per the content spec — no error code, no
 * apology, just the fact and a promise. Auto-hides the instant `online`
 * fires again.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-center gap-2 bg-ink px-4 py-[10px] text-center text-[12.5px] font-medium text-hero-text"
    >
      <span aria-hidden className="text-amber">
        ●
      </span>
      You&rsquo;re offline. We&rsquo;ll be here when you&rsquo;re back.
    </div>
  );
}
