/** Thin homepage-only strip under the hero's site chrome, announcing the live Knowledge Layer. */
export function LaunchBar() {
  return (
    <div className="bg-gradient-to-r from-[#2A3E1C] to-[#1B3A52] px-4 py-[9px] text-center md:px-10">
      <p className="text-[12px] text-eyebrow-dark">
        The Knowledge Layer is Live. Explore{" "}
        <b className="font-bold text-amber">
          Ritual Guides, Panchang &amp; Dharmic Concepts
        </b>{" "}
        — free to access.
      </p>
    </div>
  );
}
