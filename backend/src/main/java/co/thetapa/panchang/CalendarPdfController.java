package co.thetapa.panchang;

import co.thetapa.ritualcard.RitualCardService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The free 2026 calendar PDF — every observance on the verified calendar,
 * grouped by month, rendered through the same Playwright pipeline as the
 * ritual cards. Free, no login (PRD). Cached until the panchang cache evicts.
 */
@RestController
@RequestMapping("/api/v1/panchang")
public class CalendarPdfController {

    private final CalendarPdfService service;

    public CalendarPdfController(CalendarPdfService service) {
        this.service = service;
    }

    @GetMapping("/calendar.pdf")
    public ResponseEntity<byte[]> calendar() {
        byte[] pdf = service.render(2026);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"tapa-vrat-calendar-2026.pdf\"")
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
            .body(pdf);
    }

    @Service
    public static class CalendarPdfService {

        private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM · EEE");

        private final ObservanceRepository observances;
        private final RitualCardService renderer;

        public CalendarPdfService(ObservanceRepository observances, RitualCardService renderer) {
            this.observances = observances;
            this.renderer = renderer;
        }

        @Cacheable(value = "panchang", key = "'calendar-pdf-' + #year")
        public byte[] render(int year) {
            List<Observance> all = observances
                .findByDateBetweenOrderByDateAsc(LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));

            Map<String, List<Observance>> byMonth = new LinkedHashMap<>();
            for (Observance o : all) {
                String month = o.getDate().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                byMonth.computeIfAbsent(month, k -> new java.util.ArrayList<>()).add(o);
            }

            StringBuilder body = new StringBuilder();
            byMonth.forEach((month, entries) -> {
                body.append("<h2>").append(month).append(" ").append(year).append("</h2><table>");
                for (Observance o : entries) {
                    body.append("<tr><td class=\"d\">").append(DAY.format(o.getDate()))
                        .append("</td><td class=\"n\">").append(escape(o.getName()))
                        .append(o.getSeriesPosition() == null ? ""
                            : " <span class=\"sp\">(" + escape(o.getSeriesPosition()) + ")</span>")
                        .append("<div class=\"t\">").append(escape(nullSafe(o.getTithiLabel())))
                        .append("</div></td><td class=\"b b-").append(o.getType().name().toLowerCase())
                        .append("\">").append(badge(o)).append("</td></tr>");
                }
                body.append("</table>");
            });

            String html = """
                <!doctype html><html><head><meta charset="utf-8"><style>
                  @page { margin: 0; }
                  body { margin:0; padding:28px 30px; width:390px; box-sizing:border-box;
                         background:#F2EDE4; color:#2C2010;
                         font-family:system-ui,-apple-system,'Segoe UI',sans-serif; font-size:11px; }
                  .mast { text-align:center; margin-bottom:6px; }
                  .mast .g { color:#D4175A; font-size:24px; font-weight:700; }
                  h1 { font-size:16px; margin:2px 0 1px; text-align:center; }
                  .sub { text-align:center; color:#8A7A68; font-size:9.5px; margin-bottom:14px; }
                  h2 { font-size:12px; color:#A07800; border-bottom:1px solid #E8E0D0;
                       padding-bottom:3px; margin:16px 0 6px; text-transform:uppercase;
                       letter-spacing:0.6px; }
                  table { width:100%%; border-collapse:collapse; }
                  td { padding:4px 4px 4px 0; vertical-align:top; border-bottom:1px solid #F0E8D8; }
                  .d { width:74px; color:#5C4B12; font-weight:600; white-space:nowrap; }
                  .n { font-weight:700; }
                  .sp { font-weight:400; color:#8A7A68; }
                  .t { font-weight:400; color:#8A7A68; font-size:9.5px; }
                  .b { width:64px; text-align:right; font-size:8.5px; font-weight:700;
                       letter-spacing:0.4px; white-space:nowrap; }
                  .b-vrat { color:#1A5C28; } .b-festival { color:#D4175A; }
                  .b-special_seasonal { color:#A07800; } .b-purnima_amavasya { color:#1F4460; }
                  .b-eclipse { color:#4A3525; }
                  .foot { margin-top:18px; text-align:center; color:#8A7A68; font-size:9px; }
                </style></head><body>
                  <div class="mast"><span class="g">&#2340;&#2346;&#2381;</span></div>
                  <h1>Vrat &amp; Festival Calendar %d</h1>
                  <p class="sub">Drik Panchang &#183; Delhi-NCR (IST) &#183; Purnimanta &#183;
                     dates linked to guides at thetapaco.com</p>
                  %s
                  <p class="foot">thetapaco.com &#183; free to share &#183; regenerated when the
                     calendar is updated</p>
                </body></html>
                """.formatted(year, body);

            return renderer.renderPdf(html);
        }

        private static String badge(Observance o) {
            return switch (o.getType()) {
                case VRAT -> "VRAT";
                case FESTIVAL -> "FESTIVAL";
                case SPECIAL_SEASONAL -> "SEASONAL";
                case PURNIMA_AMAVASYA -> "PURNIMA·AMAVASYA";
                case ECLIPSE -> "ECLIPSE";
            };
        }

        private static String nullSafe(String s) {
            return s == null ? "" : s;
        }

        private static String escape(String s) {
            return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        }
    }
}
