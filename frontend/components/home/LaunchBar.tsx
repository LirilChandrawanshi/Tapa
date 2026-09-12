import { sectionText, type HomeSection } from "@/lib/homeExtras";

/**
 * Thin homepage-only strip under the hero's site chrome, announcing the live
 * Knowledge Layer. Copy is CMS-editable (`launch-bar`); the literals below are
 * the fallback, so the strip reads the same if the API is unreachable.
 */
export function LaunchBar({ section }: { section?: HomeSection }) {
  return (
    <div className="bg-gradient-to-r from-[#2A3E1C] to-[#1B3A52] px-4 py-[9px] text-center md:px-10">
      <p className="text-[12px] text-eyebrow-dark">
        {sectionText(section, "textBefore", "The Knowledge Layer is Live. Explore ")}
        <b className="font-bold text-amber">
          {sectionText(
            section,
            "highlight",
            "Ritual Guides, Panchang & Dharmic Concepts",
          )}
        </b>
        {sectionText(section, "textAfter", " — free to access.")}
      </p>
    </div>
  );
}
