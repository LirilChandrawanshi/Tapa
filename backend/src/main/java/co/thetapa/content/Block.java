package co.thetapa.content;

import java.util.List;
import java.util.Map;

/**
 * One ordered body block of an article. A single flexible shape rather than a
 * class hierarchy: Mongo stores it naturally and the admin editor round-trips it
 * without polymorphic deserialization ceremony. Only the fields relevant to the
 * block's {@code type} are populated.
 */
public record Block(
    BlockType type,
    String title,                 // section heading (accordion label)
    String text,                  // rich text body for prose blocks
    List<VidhiStep> steps,        // VIDHI
    List<SamagriItem> samagri,    // SAMAGRI (checklist, max 8 items per PRD)
    List<Myth> myths,             // MYTHS
    Mantra mantra,                // MANTRA
    Sankalpa sankalpa,            // SANKALPA
    List<FastingForm> fasting,    // FASTING (Nirjala/Sajal/Phalahar cards)
    List<KathaBeat> beats,        // KATHA — structured story beats, optional (flat `text` still renders when absent)
    DvpSplit dvp,                 // DHARMA_VS_PRATHA — the two named columns
    Dpb dpb,                      // section-level classification (concept template's per-section tag row)
    Map<String, String> meta      // anything block-specific (quote attribution, image ids…)
) {

    public enum BlockType {
        INTRO, ORIGIN, SIGNIFICANCE_QUOTE, SANKALPA, SAMAGRI, VIDHI,
        MANTRA, FASTING, KATHA, DHARMA_VS_PRATHA, MYTHS, QA, PROSE
    }

    /**
     * The "Dharma vs Pratha" section: two named columns, each with its own
     * classification and score. Modelled as a first-class shape rather than
     * left to PROSE, because the split is the PRD's central editorial claim —
     * what scripture states, versus what custom added — and prose cannot
     * carry the two badges or keep the two lists from blurring into one.
     */
    public record DvpSplit(
        String lead,                // one line above the two columns
        String dharmaHeading,       // e.g. "Named in text"
        List<String> dharmaPoints,
        Dpb dharmaDpb,              // the DHARMA badge + score for this column
        String prathaHeading,       // e.g. "Cultural, not text"
        List<String> prathaPoints,
        Dpb prathaDpb               // the PRATHA badge + score
    ) {
    }

    public record VidhiStep(int number, String title, String description, String note, Dpb dpb, String mantraChip,
                             Boolean highlight) {
    }

    /** One beat of a KATHA block's structured story (mock: 4-up "story beats" grid). */
    public record KathaBeat(String title, String description) {
    }

    public record SamagriItem(String name, String note, boolean optional) {
    }

    public record Myth(String question, String answer) {
    }

    public record Mantra(String devanagari, String transliteration, String meaning,
                         int defaultCount, List<Integer> presets,
                         String audioEnMediaId, String audioHiMediaId) {
    }

    public record Sankalpa(String devanagari, String transliteration, String gloss) {
    }

    public record FastingForm(String name, String description, boolean recommended) {
    }
}
