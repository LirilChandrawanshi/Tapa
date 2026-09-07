package co.thetapa.circle;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleStatus;
import co.thetapa.panchang.Observance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Pure builders for the three Circle template variable sets
 * (TapaCircle_WhatsApp_Spec_v2). Kept static and side-effect free so the
 * formatting rules are unit-testable without Spring or Mongo.
 */
public final class CircleTemplateVars {

    /** "Sunday, 11 October" — T1 {{2}} only; the weekday belongs to the welcome. */
    static final DateTimeFormatter OCCASION_DATE =
        DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale.ENGLISH);
    /** "11 October" — T2 {{1}} per spec (#28): no weekday in the reminder date. */
    static final DateTimeFormatter REMINDER_DATE =
        DateTimeFormatter.ofPattern("d MMMM", Locale.ENGLISH);
    /** "6:04 PM" */
    static final DateTimeFormatter TITHI_TIME =
        DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
    /** ", 10 October" suffix when a tithi boundary is not on the occasion day */
    static final DateTimeFormatter TITHI_DAY =
        DateTimeFormatter.ofPattern("d MMMM", Locale.ENGLISH);

    private CircleTemplateVars() {
    }

    /** T1 tapa_circle_welcome: {{1}} first upcoming occasion name, {{2}} its date. */
    public static Map<String, String> welcomeVars(Observance nextOccasion) {
        Map<String, String> vars = new LinkedHashMap<>();
        if (nextOccasion != null) {
            vars.put("1", nextOccasion.getName());
            vars.put("2", nextOccasion.getDate().format(OCCASION_DATE));
        } else {
            // calendar gap — template still needs both placeholders filled
            vars.put("1", "the next vrat on the Tapa calendar");
            vars.put("2", "soon");
        }
        return vars;
    }

    /**
     * T2 tapa_circle_reminder vars.
     * <ul>
     *   <li>{{1}} occasion date "11 October" (no weekday — spec keeps the
     *       weekday to the T1 welcome only)</li>
     *   <li>{{2}} occasion name</li>
     *   <li>{{3}} tithi start time, with ", d MMMM" appended when it starts on a
     *       day other than the occasion date (the spec's previous-day case)</li>
     *   <li>{{4}} tithi end time, same date-suffix rule (tithis routinely end next day)</li>
     *   <li>{{5}} circle teaser, hard-capped at 100 chars; KEY OMITTED when blank</li>
     *   <li>{{6}} guide URL — the linked published article, else /ritual-guides</li>
     *   <li>{{7}} pujan URL — /ritual-pujans fallback (a specific pujan link arrives
     *       with Phase-2 commerce; nothing links one today)</li>
     * </ul>
     */
    public static Map<String, String> reminderVars(Observance o, Article guide, String siteBaseUrl) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("1", o.getDate().format(REMINDER_DATE));
        vars.put("2", o.getName());
        vars.put("3", formatTithiBoundary(o.getTithiStartsAt(), o.getDate()));
        vars.put("4", formatTithiBoundary(o.getTithiEndsAt(), o.getDate()));
        String teaser = o.getCircleTeaser();
        if (teaser != null && !teaser.isBlank()) {
            teaser = teaser.strip();
            vars.put("5", teaser.length() <= 100 ? teaser : teaser.substring(0, 100));
        }
        vars.put("6", guideUrl(guide, siteBaseUrl));
        vars.put("7", siteBaseUrl + "/ritual-pujans");
        return vars;
    }

    /**
     * Formats an ISO tithi boundary as "6:04 PM", appending ", 10 October" when
     * the boundary is not on the occasion date. Unparseable/absent values fall
     * back to the raw string or "—" — the reminder must still go out.
     */
    static String formatTithiBoundary(String iso, LocalDate occasionDate) {
        if (iso == null || iso.isBlank()) {
            return "—";
        }
        try {
            LocalDateTime at = LocalDateTime.parse(iso.strip());
            String time = at.format(TITHI_TIME);
            if (!at.toLocalDate().equals(occasionDate)) {
                return time + ", " + at.toLocalDate().format(TITHI_DAY);
            }
            return time;
        } catch (DateTimeParseException e) {
            return iso.strip();
        }
    }

    /** Published guide → /ritual-guides/<subCategory>/<slug>; anything else → /ritual-guides. */
    static String guideUrl(Article guide, String siteBaseUrl) {
        if (guide != null && guide.getStatus() == ArticleStatus.PUBLISHED
            && guide.getSubCategory() != null && guide.getSlug() != null) {
            return siteBaseUrl + "/ritual-guides/" + guide.getSubCategory() + "/" + guide.getSlug();
        }
        return siteBaseUrl + "/ritual-guides";
    }

    /**
     * T2 header image: the guide's 800x418 WhatsApp variant, else its hero image,
     * else null — and the template header is omitted when null (no guide, no header).
     */
    static String headerImageUrl(Article guide, String mediaBaseUrl) {
        if (guide == null || guide.getStatus() != ArticleStatus.PUBLISHED) {
            return null;
        }
        String imageId = guide.getWaImageId() != null ? guide.getWaImageId() : guide.getHeroImageId();
        return imageId == null ? null : mediaBaseUrl + "/" + imageId;
    }
}
