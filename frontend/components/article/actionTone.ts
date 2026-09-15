/**
 * Shared skin for the Save / Share button pair, which appears both in a light
 * control bar and overlaid on a dark hero. Kept in its own module so the two
 * components that render it don't have to import each other.
 */

/** Where the button sits — a light control bar, or over the dark hero. */
export type ActionTone = "bar" | "hero";

export const ACTION_BTN =
  "flex h-[35px] items-center gap-[6px] rounded-lg border-[1.5px] px-[14px] text-[13px]";

export function actionSkin(tone: ActionTone) {
  return tone === "hero"
    ? "border-white/25 bg-white/10 text-hero-text backdrop-blur hover:border-white/50"
    : "border-border bg-card text-body hover:border-cta";
}
