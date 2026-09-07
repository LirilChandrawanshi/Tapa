package co.thetapa.glossary;

import co.thetapa.ritualcard.RitualCardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Renders the whole glossary as a single print-ready PDF (#118) through the
 * same Playwright pipeline the ritual cards use. The result is cached under
 * the "glossary" cache, keyed by a cheap corpus fingerprint (count + latest
 * update) so an edited or added term produces a fresh document without any
 * explicit eviction wiring.
 */
@Service
public class GlossaryPdfService {

    private static final Logger log = LoggerFactory.getLogger(GlossaryPdfService.class);

    private final GlossaryRepository glossary;
    private final RitualCardService renderer;

    public GlossaryPdfService(GlossaryRepository glossary, RitualCardService renderer) {
        this.glossary = glossary;
        this.renderer = renderer;
    }

    /** Cheap change detector used as the cache key. */
    public String fingerprint() {
        List<GlossaryTerm> terms = glossary.findAllByOrderByTermAsc();
        Instant latest = terms.stream()
            .map(GlossaryTerm::getUpdatedAt)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(Instant.EPOCH);
        return terms.size() + "@" + latest;
    }

    @Cacheable("glossary")
    public byte[] render(String fingerprint) {
        List<GlossaryTerm> terms = glossary.findAllByOrderByTermAsc();
        log.info("glossary pdf: rendering {} terms ({})", terms.size(), fingerprint);
        return renderer.renderPdf(html(terms));
    }

    /**
     * Self-contained HTML — a compact two-column list of term, Devanagari and
     * definition. 390px CSS width maps to the renderer's 105mm sheet.
     */
    private static String html(List<GlossaryTerm> terms) {
        StringBuilder entries = new StringBuilder();
        for (GlossaryTerm t : terms) {
            entries.append("<div class=\"entry\">")
                .append("<div class=\"term\">").append(esc(t.getTerm()));
            if (t.getDevanagari() != null && !t.getDevanagari().isBlank()) {
                entries.append(" <span class=\"dev\">").append(esc(t.getDevanagari())).append("</span>");
            }
            entries.append("</div>")
                .append("<div class=\"def\">").append(esc(t.getDefinition())).append("</div>")
                .append("</div>");
        }
        return """
            <!doctype html><html><head><meta charset="utf-8"><style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { width: 390px; font-family: Georgia, 'Noto Serif', serif;
                     color: #241A10; background: #FFFDF8; padding: 16px 14px; }
              h1 { font-size: 15px; letter-spacing: 0.3px; margin-bottom: 2px; }
              .sub { font-size: 8.5px; color: #8A7A64; margin-bottom: 10px; }
              .cols { columns: 2; column-gap: 14px; column-rule: 0.5px solid #E8DFCE; }
              .entry { break-inside: avoid; margin-bottom: 7px; }
              .term { font-size: 9.5px; font-weight: bold; }
              .dev { font-weight: normal; color: #A8842B; }
              .def { font-size: 8px; line-height: 1.45; color: #4A3D2C; }
              .foot { margin-top: 10px; font-size: 7.5px; color: #8A7A64;
                      border-top: 0.5px solid #E8DFCE; padding-top: 5px; }
            </style></head><body>
              <h1>The Tapa Co. — Glossary</h1>
              <div class="sub">Every word we use, explained once · thetapaco.com/glossary</div>
              <div class="cols">%s</div>
              <div class="foot">Entries carry no classification tag and no confidence score —
              a definition is not a ritual-authority claim.</div>
            </body></html>
            """.formatted(entries);
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
