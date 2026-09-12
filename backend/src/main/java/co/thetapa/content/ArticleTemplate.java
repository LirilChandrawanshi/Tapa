package co.thetapa.content;

import java.util.List;
import java.util.Map;

import static co.thetapa.content.Block.BlockType.*;

/**
 * The section recipe for each article type, taken from the Aug-30 HTML
 * templates in the spec bundle.
 *
 * One source of truth, on the server. The CMS reads this same recipe to
 * scaffold a new article and to draw its completeness checklist, so the
 * editor cannot drift from what the publish gate actually enforces — if the
 * checklist says an article is ready, publishing it succeeds.
 *
 * `required` is ordered. That order is the order the sections are scaffolded
 * in and the order the reader meets them in.
 */
public final class ArticleTemplate {

    private ArticleTemplate() {
    }

    /**
     * `required` blocks publishing. Keep it to what genuinely makes the type
     * meaningful — a ritual guide with no steps is not a guide — because a
     * gate that fires on every existing article is a gate everyone learns to
     * route around.
     *
     * `recommended` is the full shape from the spec template. The CMS shows
     * it as a checklist and scaffolds it, but it never blocks: not every
     * ritual guide is a fast, and not every concept has a story.
     */
    public record Recipe(
        List<Block.BlockType> required,
        List<Block.BlockType> recommended
    ) {
        /** Scaffold order for a new article: the whole shape, spec order. */
        public List<Block.BlockType> scaffold() {
            return java.util.stream.Stream.concat(required.stream(), recommended.stream())
                .distinct()
                .toList();
        }
    }

    private static final Map<ArticleType, Recipe> RECIPES = Map.of(
        /*
         * Ritual guide. Aja_Ekadashi_Ritual_Guide.html runs Origin → Sankalp →
         * Samagri → Vidhi → Fasting → Katha → Dharma vs Pratha → Myths, and a
         * festival guide should run that way.
         *
         * Only Vidhi is enforced, though. Griha Pravesh and Naamkaran are
         * ritual guides that involve no fast at all, and Shraddha has no
         * katha — requiring those sections would be requiring editors to
         * invent them.
         */
        ArticleType.RITUAL_GUIDE, new Recipe(
            List.of(VIDHI),
            List.of(ORIGIN, SANKALPA, SAMAGRI, FASTING, KATHA, DHARMA_VS_PRATHA, MYTHS, MANTRA, QA)
        ),

        /*
         * Beginner's guide. Beginner_s Guide.html is prose sections plus a
         * "Common worries — answered" block. Nothing structural is universal
         * across them, so nothing is enforced.
         */
        ArticleType.BEGINNER_GUIDE, new Recipe(
            List.of(),
            List.of(PROSE, QA, MYTHS, SIGNIFICANCE_QUOTE)
        ),

        /*
         * Dharmic concept. Dharmic Concepts-Meanings.html carries three
         * stories and a myths section, but that is one concept among many —
         * "akshata, unbroken rice" has no story to tell, and saying so is the
         * point of the category.
         */
        ArticleType.DHARMIC_CONCEPT, new Recipe(
            List.of(),
            List.of(KATHA, MYTHS, DHARMA_VS_PRATHA, PROSE, SIGNIFICANCE_QUOTE, QA)
        )
    );

    private static final Recipe UNTYPED = new Recipe(List.of(), List.of(PROSE));

    public static Recipe of(ArticleType type) {
        // A draft can legitimately have no type yet, and Map.of() rejects a
        // null key outright rather than missing — so check before the lookup.
        if (type == null) return UNTYPED;
        return RECIPES.getOrDefault(type, UNTYPED);
    }

    /** Required sections that are absent, or present but carrying nothing. */
    public static List<Block.BlockType> missingSections(Article article) {
        return gaps(article, of(article.getType()).required());
    }

    /** Recommended sections not yet present. Advisory — never blocks publish. */
    public static List<Block.BlockType> missingRecommended(Article article) {
        return gaps(article, of(article.getType()).recommended());
    }

    private static List<Block.BlockType> gaps(Article article, List<Block.BlockType> wanted) {
        if (article.getType() == null) return List.of();
        var en = article.getLang() == null ? null : article.getLang().get("en");
        List<Block> blocks = en == null || en.blocks() == null ? List.of() : en.blocks();
        boolean hasIntroField = en != null && hasText(en.introHtml());
        return wanted.stream()
            .filter(needed -> {
                // An article's intro normally lives in ArticleContent.introHtml
                // rather than in an INTRO block, and both read the same.
                if (needed == INTRO && hasIntroField) return false;
                return blocks.stream().noneMatch(b -> b.type() == needed && hasContent(b));
            })
            .toList();
    }

    /**
     * A section counts as filled when the field its own type actually uses
     * carries something. An empty VIDHI with a heading is not a vidhi.
     */
    public static boolean hasContent(Block b) {
        if (b == null || b.type() == null) return false;
        return switch (b.type()) {
            case VIDHI -> notEmpty(b.steps());
            case SAMAGRI -> notEmpty(b.samagri());
            case MYTHS -> notEmpty(b.myths());
            case MANTRA -> b.mantra() != null;
            case SANKALPA -> b.sankalpa() != null;
            case FASTING -> notEmpty(b.fasting());
            case KATHA -> notEmpty(b.beats()) || hasText(b.text());
            case DHARMA_VS_PRATHA -> b.dvp() != null
                && (notEmpty(b.dvp().dharmaPoints()) || notEmpty(b.dvp().prathaPoints()));
            case QA -> notEmpty(b.myths()) || hasText(b.text());
            default -> hasText(b.text()) || hasText(b.title());
        };
    }

    private static boolean notEmpty(List<?> list) {
        return list != null && !list.isEmpty();
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
