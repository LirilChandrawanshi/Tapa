package co.thetapa.content;

/**
 * Classification block attached to an article or an individual vidhi step.
 * Validation rules live in {@link DpbValidator}.
 */
public record Dpb(
    DpbTag classification,
    Integer confidenceScore,   // 1–5; null for BHRANTI
    String sourceName,         // named text, e.g. "Shiva Purana" — required for DHARMA
    String sourceRef,          // e.g. "Rudra Samhita / Parvati Khanda"
    String sourceClass,        // VEDIC | PURANIC | NIBANDHA | BHAKTI | CUSTOM
    String confidenceNote,     // one-line editorial note
    String prathaScope         // e.g. "North India — Rajasthan, UP, Bihar" — required for PRATHA
) {
}
