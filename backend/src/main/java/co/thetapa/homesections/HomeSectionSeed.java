package co.thetapa.homesections;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The copy exactly as it stood in the JSX when these bands were made editable.
 *
 * <p>Two jobs. On first boot {@link HomeSectionService} inserts any missing
 * key from here, so switching the homepage over to the CMS renders the same
 * page it rendered before. And because the frontend keeps the same literals as
 * its own fallback, an empty collection or a downed API still renders the
 * page — nothing here is load-bearing at request time.</p>
 *
 * <p>Existing rows are never overwritten: once an editor changes a line, the
 * seed stops having an opinion about it.</p>
 */
final class HomeSectionSeed {

    private HomeSectionSeed() {
    }

    private static Map<String, String> f(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put(kv[i], kv[i + 1]);
        }
        return m;
    }

    static List<HomeSection> defaults() {
        return List.of(
            section("launch-bar", "Launch bar",
                f("textBefore", "The Knowledge Layer is Live. Explore ",
                  "highlight", "Ritual Guides, Panchang & Dharmic Concepts",
                  "textAfter", " — free to access."),
                List.of()),

            section("hero-chrome", "Hero — labels & buttons",
                f("todayLabel", "Today's Ritual",
                  "upcomingLabel", "Coming up",
                  "featuredLabel", "Featured guide",
                  "trustLine", "Sourced from named scripture · every claim tagged · nothing driven by fear",
                  "primaryCta", "▶ Start today's vrat",
                  "secondaryCta", "📖 Read complete vidhi",
                  "audioCta", "🎧 Listen instead"),
                List.of()),

            section("category-spotlight", "Dharmic Concepts spotlight",
                f("eyebrow", "Dharmic Concepts · Materials",
                  "title", "Why is bilva dear to Mahadev?",
                  "body", "A hunter got lost in a forest, climbed a tree, and dropped leaves"
                      + " through the night to stay awake. He did not know there was a"
                      + " Shivalinga at the roots. He did not know it was a bilva tree.",
                  "ctaLabel", "Read the story ›",
                  "ctaHref", "/dharmic-concepts",
                  "quoteLead", "Three leaves, one stem. The tree did not study scripture to grow this way.",
                  "quoteBold", "The tradition looked at what grew and recognised something it already knew.",
                  "dpbTag", "dharma",
                  "dpbScore", "4",
                  "dpbSource", "Puranic",
                  "pill", "Shiva Purana · Bilvashtakam"),
                List.of()),

            section("beginners-rail", "New to this? rail",
                f("eyebrow", "New to all this?",
                  "title", "Start here — no Sanskrit required",
                  "description", "Written for the first time you do anything: no tags, no citations,"
                      + " no words to look up. The sourced versions are one tap away when you want them.",
                  "viewAllLabel", "All beginner's guides",
                  "href", "/ritual-guides/beginners-guides",
                  "cardCta", "Begin ›"),
                List.of(
                    f("n", "01", "title", "Your first vrat, start to finish",
                      "copy", "What a vrat actually asks of you — and what it doesn't."
                          + " Sankalp, the fast, and how the day ends."),
                    f("n", "02", "title", "Daily puja at home",
                      "copy", "A simple morning practice in ten minutes — no elaborate setup,"
                          + " nothing you must buy."),
                    f("n", "03", "title", "Reading the panchang",
                      "copy", "Tithi, paksha and nakshatra in plain language, so a date on the"
                          + " calendar starts to make sense."))),

            section("method-band", "How we decide what is true",
                f("eyebrow", "How we decide what is true",
                  "title", "Every badge on this page means something specific",
                  "body", "Dharma, Pratha or Bhranti — with a confidence score you can check."
                      + " If we cannot name the text a reader could open, we do not make the claim.",
                  "ctaLabel", "Read our editorial method ›",
                  "ctaHref", "/editorial-method"),
                // The three keys are the locked DPB vocabulary — the component
                // maps each to its own colour token, so only the copy is open.
                List.of(
                    f("key", "DHARMA", "copy", "Named in a text you could open yourself."),
                    f("key", "PRATHA", "copy", "Regional or family custom. Real — not scripture."),
                    f("key", "BHRANTI", "copy", "A misconception. Corrected in every guide it appears in."))),

            section("circle-band", "Tapa Circle band",
                f("emoji", "💬",
                  "eyebrow", "The Tapa Circle",
                  "title", "Never miss a date again",
                  "body", "Festival and vrat reminders on WhatsApp, with the guide attached"
                      + " and the kit cut-off if there is one. Free, always.",
                  "ctaLabel", "Join the Tapa Circle ›",
                  "ctaHref", "/tapa-circle?from=/"),
                List.of()),

            section("purohit-strip", "Pujan with Purohit strip",
                f("emoji", "🙏",
                  "title", "Pujan with Purohit — Coming soon",
                  "body", "Book a verified purohit for your pujan. A purohit is convenience,"
                      + " not validity — the guides remain free either way.",
                  "badge", "Opening with Phase 2"),
                List.of()));
    }

    private static HomeSection section(String key, String label,
                                       Map<String, String> fields,
                                       List<Map<String, String>> items) {
        HomeSection s = new HomeSection();
        s.setKey(key);
        s.setLabel(label);
        s.setPublished(true);
        s.setFields(fields);
        s.setItems(items);
        return s;
    }
}
