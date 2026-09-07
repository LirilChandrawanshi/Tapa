package co.thetapa.ritualcard;

import co.thetapa.content.Article;
import co.thetapa.content.Block;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.PanchangDay;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Pure assembly of a {@link CardModel} from the article + (optional) linked
 * observance + (optional) panchang day. No Spring, no I/O — unit-testable.
 *
 * <p>Pragmatic rules (documented per the M8 spec):</p>
 * <ul>
 *   <li><b>Panchang field set</b> — chosen from the observance series/slug
 *       (falling back to the article slug): contains "ekadashi" →
 *       Date/Tithi/Fast/<i>Parana</i>; contains "teej" →
 *       Date/Tithi/Fast/<i>Break</i>; anything else (festival default) →
 *       Date/Tithi/<i>Muhurat</i>. Fields whose value cannot be resolved are
 *       omitted gracefully.</li>
 *   <li><b>Fast cell</b> — value is the FASTING block's {@code meta["duration"]}
 *       when present (sub = recommended form name), else the recommended (or
 *       first) fasting form name.</li>
 *   <li><b>Parana / Break cell</b> — next civil day after the observance
 *       ({@code endDate + 1} for multi-day, else {@code date + 1}), sub-label
 *       "At sunrise" (Drik Panchang convention).</li>
 *   <li><b>Two-column samagri</b> — only when the SAMAGRI block's meta carries
 *       BOTH {@code groupA} and {@code groupB} (the column headings). The item
 *       list is split at {@code meta["splitAt"]} (1-based count of items in
 *       group A) when present, else at ceil(n/2). Otherwise a single column.
 *       All items render (the spec caps vidhi steps, not samagri); a hard
 *       safety cap of 14 items applies with a warning log.</li>
 *   <li><b>Multi-day vidhi sub-headers</b> — a step whose {@code note} starts
 *       with {@code "day:"} (case-insensitive) gets the day label rendered as
 *       an italic sub-header above it; alternatively the VIDHI block meta key
 *       {@code "day.<stepNumber>"} supplies the text. Only the label itself is
 *       rendered — any editorial tail after the first sentence boundary is
 *       dropped — and a sub-header is emitted once per day group (a repeat of
 *       the previously emitted label is suppressed). Max 8 steps (first 8);
 *       the last rendered step gets the rose circle.</li>
 *   <li><b>Mantra count line</b> — built from the block's defaultCount +
 *       presets ("Chant N times with a mala, or a / b / c times"); the spec's
 *       fixed preset line is the fallback when the block carries no counts.</li>
 * </ul>
 */
final class CardModelBuilder {

    private static final Logger log = LoggerFactory.getLogger(CardModelBuilder.class);

    private static final DateTimeFormatter LONG_DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter SHORT_DATE = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final String DEFAULT_COUNT_LINE = "Chant 108 times with a mala, or 11 / 21 / 51 times";
    private static final int MAX_STEPS = 8;
    private static final int MAX_SAMAGRI_ITEMS = 14;
    private static final int MAX_FASTING_LINES = 3;

    private CardModelBuilder() {
    }

    static CardModel build(Article article, Observance observance, PanchangDay day) {
        Article.ArticleContent en = article.getLang() == null ? null : article.getLang().get("en");
        List<Block> blocks = en != null && en.blocks() != null ? en.blocks() : List.of();

        Block samagriBlock = firstOf(blocks, Block.BlockType.SAMAGRI);
        Block vidhiBlock = firstOf(blocks, Block.BlockType.VIDHI);
        Block mantraBlock = firstOf(blocks, Block.BlockType.MANTRA);
        Block fastingBlock = firstOf(blocks, Block.BlockType.FASTING);

        LocalDate date = observance != null && observance.getDate() != null
            ? observance.getDate() : article.getObservanceDate();

        String festivalName = observance != null && observance.getName() != null
            ? observance.getName()
            : (en != null ? en.title() : article.getSlug());

        String tithiLabel = resolveTithiLabel(observance, day);

        return new CardModel(
            article.getSlug(),
            festivalName,
            headerSubLine(date, tithiLabel),
            panchangFields(article, observance, day, date, tithiLabel, fastingBlock),
            samagri(samagriBlock, article.getSlug()),
            steps(vidhiBlock),
            mantra(mantraBlock),
            fasting(fastingBlock),
            "https://thetapaco.com/ritual-guides/" + article.getSubCategory() + "/" + article.getSlug(),
            sourceLine(date)
        );
    }

    // ---- header -------------------------------------------------------------

    private static String headerSubLine(LocalDate date, String tithiLabel) {
        List<String> parts = new ArrayList<>();
        if (date != null) {
            parts.add(LONG_DATE.format(date));
            parts.add(date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH));
        }
        if (tithiLabel != null) {
            parts.add(tithiLabel);
        }
        return String.join(" · ", parts);
    }

    private static String resolveTithiLabel(Observance observance, PanchangDay day) {
        if (observance != null && observance.getTithiLabel() != null) {
            return observance.getTithiLabel();
        }
        if (day != null && day.getTithi() != null && day.getTithi().name() != null) {
            List<String> parts = new ArrayList<>();
            if (day.getLunarMonth() != null) parts.add(day.getLunarMonth());
            if (day.getPaksha() != null) parts.add(day.getPaksha());
            parts.add(day.getTithi().name());
            return String.join(" ", parts);
        }
        return null;
    }

    private static String sourceLine(LocalDate date) {
        int year = date != null ? date.getYear() : LocalDate.now().getYear();
        return "Source: Drik Panchang, Delhi-NCR · " + year;
    }

    // ---- panchang strip -----------------------------------------------------

    private enum FieldSet { FESTIVAL, EKADASHI, TEEJ }

    private static FieldSet fieldSet(Article article, Observance observance) {
        String key = ((observance != null && observance.getSeries() != null ? observance.getSeries() : "")
            + " " + (observance != null && observance.getSlug() != null ? observance.getSlug() : "")
            + " " + article.getSlug()).toLowerCase(Locale.ROOT);
        if (key.contains("ekadashi")) return FieldSet.EKADASHI;
        if (key.contains("teej")) return FieldSet.TEEJ;
        return FieldSet.FESTIVAL;
    }

    private static List<CardModel.PanchangField> panchangFields(Article article, Observance observance,
                                                                PanchangDay day, LocalDate date,
                                                                String tithiLabel, Block fastingBlock) {
        FieldSet set = fieldSet(article, observance);
        List<CardModel.PanchangField> fields = new ArrayList<>();

        if (date != null) {
            fields.add(new CardModel.PanchangField("Date", SHORT_DATE.format(date),
                date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH), false));
        }
        if (tithiLabel != null) {
            fields.add(new CardModel.PanchangField("Tithi", tithiLabel, null, false));
        }

        if (set == FieldSet.FESTIVAL) {
            CardModel.PanchangField muhurat = muhuratField(day);
            if (muhurat != null) fields.add(muhurat);
        } else {
            CardModel.PanchangField fast = fastField(fastingBlock);
            if (fast != null) fields.add(fast);
            LocalDate next = nextDay(observance, date);
            if (next != null) {
                fields.add(new CardModel.PanchangField(
                    set == FieldSet.EKADASHI ? "Parana" : "Break",
                    SHORT_DATE.format(next), "At sunrise", false));
            }
        }
        return fields;
    }

    private static CardModel.PanchangField muhuratField(PanchangDay day) {
        if (day == null) return null;
        if (day.getMuhurats() != null && !day.getMuhurats().isEmpty()) {
            PanchangDay.Muhurat m = day.getMuhurats().get(0);
            return new CardModel.PanchangField("Muhurat", m.from() + "–" + m.to(), m.label(), false);
        }
        if (day.getAbhijitMuhurat() != null) {
            PanchangDay.TimeRange r = day.getAbhijitMuhurat();
            return new CardModel.PanchangField("Muhurat", r.from() + "–" + r.to(), "Abhijit", false);
        }
        return null;
    }

    private static CardModel.PanchangField fastField(Block fastingBlock) {
        if (fastingBlock == null || fastingBlock.fasting() == null || fastingBlock.fasting().isEmpty()) {
            return null;
        }
        Block.FastingForm main = fastingBlock.fasting().stream()
            .filter(Block.FastingForm::recommended).findFirst()
            .orElse(fastingBlock.fasting().get(0));
        String duration = fastingBlock.meta() != null ? fastingBlock.meta().get("duration") : null;
        // No highlight: per the card spec the strip renders labels gold and
        // values white — the rose accent belongs only to the last vidhi circle.
        return duration != null
            ? new CardModel.PanchangField("Fast", duration, main.name(), false)
            : new CardModel.PanchangField("Fast", main.name(), null, false);
    }

    private static LocalDate nextDay(Observance observance, LocalDate date) {
        if (observance != null && observance.getEndDate() != null) {
            return observance.getEndDate().plusDays(1);
        }
        return date != null ? date.plusDays(1) : null;
    }

    // ---- samagri ------------------------------------------------------------

    private static CardModel.SamagriSection samagri(Block block, String slug) {
        if (block == null || block.samagri() == null || block.samagri().isEmpty()) {
            return null;
        }
        List<String> names = block.samagri().stream().map(Block.SamagriItem::name).toList();
        if (names.size() > MAX_SAMAGRI_ITEMS) {
            log.warn("ritual card {}: samagri list has {} items — truncating to the hard cap of {}",
                slug, names.size(), MAX_SAMAGRI_ITEMS);
            names = names.subList(0, MAX_SAMAGRI_ITEMS);
        }
        Map<String, String> meta = block.meta();
        String groupA = meta != null ? meta.get("groupA") : null;
        String groupB = meta != null ? meta.get("groupB") : null;

        if (groupA != null && groupB != null) {
            int splitAt = (names.size() + 1) / 2;
            if (meta.get("splitAt") != null) {
                try {
                    splitAt = Math.clamp(Integer.parseInt(meta.get("splitAt").trim()), 1, names.size());
                } catch (NumberFormatException ignored) {
                    // fall through to the half split
                }
            }
            return new CardModel.SamagriSection(true, List.of(
                new CardModel.SamagriGroup(groupA, names.subList(0, splitAt)),
                new CardModel.SamagriGroup(groupB, names.subList(splitAt, names.size()))));
        }
        return new CardModel.SamagriSection(false,
            List.of(new CardModel.SamagriGroup(null, names)));
    }

    // ---- vidhi --------------------------------------------------------------

    private static List<CardModel.StepRow> steps(Block block) {
        if (block == null || block.steps() == null) {
            return List.of();
        }
        List<Block.VidhiStep> raw = block.steps().stream()
            .sorted(java.util.Comparator.comparingInt(Block.VidhiStep::number))
            .limit(MAX_STEPS)
            .toList();
        List<CardModel.StepRow> rows = new ArrayList<>(raw.size());
        String lastEmitted = null;
        for (int i = 0; i < raw.size(); i++) {
            Block.VidhiStep s = raw.get(i);
            String label = subHeaderFor(s, block.meta());
            // one sub-header per day group: suppress repeats of the label
            // already emitted for the current group
            if (label != null && label.equals(lastEmitted)) {
                label = null;
            } else if (label != null) {
                lastEmitted = label;
            }
            rows.add(new CardModel.StepRow(i + 1, s.title(), label, i == raw.size() - 1));
        }
        return rows;
    }

    private static String subHeaderFor(Block.VidhiStep step, Map<String, String> meta) {
        if (step.note() != null && step.note().regionMatches(true, 0, "day:", 0, 4)) {
            return dayLabel(step.note().substring(4));
        }
        if (meta != null) {
            String fromMeta = meta.get("day." + step.number());
            if (fromMeta != null && !fromMeta.isBlank()) {
                return dayLabel(fromMeta);
            }
        }
        return null;
    }

    /**
     * The sub-header is only the day label — editorial notes after the first
     * sentence boundary ("day: Ekadashi — 21 Aug. Offer tulsi …") are dropped,
     * never appended to the card line.
     */
    private static String dayLabel(String raw) {
        String label = raw.strip();
        int dot = label.indexOf('.');
        if (dot >= 0) {
            label = label.substring(0, dot).strip();
        }
        return label.isEmpty() ? null : label;
    }

    // ---- mantra -------------------------------------------------------------

    private static CardModel.MantraCard mantra(Block block) {
        if (block == null || block.mantra() == null) {
            return null;
        }
        Block.Mantra m = block.mantra();
        return new CardModel.MantraCard(m.devanagari(), m.transliteration(), countLine(m));
    }

    private static String countLine(Block.Mantra m) {
        if (m.defaultCount() <= 0) {
            return DEFAULT_COUNT_LINE;
        }
        StringBuilder sb = new StringBuilder("Chant ").append(m.defaultCount()).append(" times with a mala");
        if (m.presets() != null) {
            List<String> others = m.presets().stream()
                .filter(p -> p != null && p != m.defaultCount())
                .map(String::valueOf)
                .toList();
            if (!others.isEmpty()) {
                sb.append(", or ").append(String.join(" / ", others)).append(" times");
            }
        }
        return sb.toString();
    }

    // ---- fasting ------------------------------------------------------------

    private static List<CardModel.FastingLine> fasting(Block block) {
        if (block == null || block.fasting() == null || block.fasting().isEmpty()) {
            return null;
        }
        return block.fasting().stream()
            .sorted((a, b) -> Boolean.compare(b.recommended(), a.recommended()))
            .limit(MAX_FASTING_LINES)
            .map(f -> new CardModel.FastingLine(f.name(), firstSentence(f.description())))
            .toList();
    }

    private static String firstSentence(String text) {
        if (text == null) {
            return "";
        }
        String t = text.strip();
        int dot = t.indexOf('.');
        if (dot > 0 && dot < t.length() - 1) {
            t = t.substring(0, dot + 1);
        }
        return t.length() > 110 ? t.substring(0, 107) + "…" : t;
    }

    // ---- misc ---------------------------------------------------------------

    private static Block firstOf(List<Block> blocks, Block.BlockType type) {
        return blocks.stream().filter(b -> b.type() == type).findFirst().orElse(null);
    }
}
