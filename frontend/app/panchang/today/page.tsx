import { redirect } from "next/navigation";

/**
 * The nav taxonomy links "Today's Panchang" to /panchang/today; the landing
 * page IS the today dashboard, so this simply redirects until a dedicated
 * per-date page ships.
 */
export default function TodayPage() {
  redirect("/panchang");
}
