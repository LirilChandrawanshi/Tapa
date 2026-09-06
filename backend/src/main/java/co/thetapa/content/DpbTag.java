package co.thetapa.content;

/**
 * The DPB classification — Tapa's editorial IP. Every knowledge claim carries one.
 * Panchang and glossary content are exempt by design (no tag, no score).
 */
public enum DpbTag {
    DHARMA,   // scripturally mandated; requires a named text and score 3–5
    PRATHA,   // regional/family custom; score must be <= 2
    BHRANTI,  // fear-based misconception, displayed as a corrected myth; no score
    MIXED     // article-level tag when Dharma and Pratha elements coexist
}
