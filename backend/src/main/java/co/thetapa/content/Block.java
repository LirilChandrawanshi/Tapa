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
    Map<String, String> meta      // anything block-specific (quote attribution, image ids…)
) {

    public enum BlockType {
        INTRO, ORIGIN, SIGNIFICANCE_QUOTE, SANKALPA, SAMAGRI, VIDHI,
        MANTRA, FASTING, KATHA, MYTHS, QA, PROSE
    }

    public record VidhiStep(int number, String title, String description, String note, Dpb dpb, String mantraChip) {
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
