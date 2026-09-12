package co.thetapa.content;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The section recipe decides what blocks publishing and what is only advised.
 * The distinction matters: an earlier version of this recipe required every
 * section the Ekadashi template shows, which would have blocked all
 * twenty-four existing articles — including ritual guides for Griha Pravesh
 * and Naamkaran, neither of which involves a fast.
 */
class ArticleTemplateTest {

    private Article article(ArticleType type, List<Block> blocks, String introHtml) {
        Article a = new Article();
        a.setSlug("test");
        a.setType(type);
        a.setLang(Map.of("en",
            new Article.ArticleContent("Title", null, null, introHtml, blocks, null)));
        return a;
    }

    private Block vidhi() {
        return new Block(Block.BlockType.VIDHI, "Vidhi", null,
            List.of(new Block.VidhiStep(1, "Step", "Do the thing", null, null, null, false)),
            null, null, null, null, null, null, null, null, null);
    }

    @Test
    void ritualGuideWithoutVidhiIsBlocked() {
        var a = article(ArticleType.RITUAL_GUIDE, List.of(), null);
        assertThat(ArticleTemplate.missingSections(a))
            .containsExactly(Block.BlockType.VIDHI);
    }

    @Test
    void ritualGuideWithVidhiPublishesEvenWithoutAFast() {
        // Griha Pravesh and Naamkaran are ritual guides with no fasting
        // section. Requiring one would be requiring an editor to invent it.
        var a = article(ArticleType.RITUAL_GUIDE, List.of(vidhi()), null);
        assertThat(ArticleTemplate.missingSections(a)).isEmpty();
        assertThat(ArticleTemplate.missingRecommended(a))
            .contains(Block.BlockType.FASTING, Block.BlockType.DHARMA_VS_PRATHA);
    }

    @Test
    void anEmptyVidhiDoesNotCountAsAVidhi() {
        var headingOnly = new Block(Block.BlockType.VIDHI, "Vidhi", null, List.of(),
            null, null, null, null, null, null, null, null, null);
        var a = article(ArticleType.RITUAL_GUIDE, List.of(headingOnly), null);
        assertThat(ArticleTemplate.missingSections(a))
            .containsExactly(Block.BlockType.VIDHI);
    }

    @Test
    void introHtmlSatisfiesTheIntroSection() {
        // Articles carry their intro in ArticleContent.introHtml rather than
        // an INTRO block, and both read the same to a reader.
        var withField = article(ArticleType.DHARMIC_CONCEPT, List.of(), "<p>An intro.</p>");
        assertThat(ArticleTemplate.missingRecommended(withField))
            .doesNotContain(Block.BlockType.INTRO);
    }

    @Test
    void conceptsAndBeginnerGuidesNeverBlockOnStructure() {
        assertThat(ArticleTemplate.missingSections(
            article(ArticleType.DHARMIC_CONCEPT, List.of(), null))).isEmpty();
        assertThat(ArticleTemplate.missingSections(
            article(ArticleType.BEGINNER_GUIDE, List.of(), null))).isEmpty();
    }

    @Test
    void aDraftWithNoTypeYetIsNotRejected() {
        assertThat(ArticleTemplate.missingSections(article(null, List.of(), null))).isEmpty();
    }

    @Test
    void dharmaVsPrathaNeedsAtLeastOneColumnFilled() {
        var empty = new Block(Block.BlockType.DHARMA_VS_PRATHA, "Dharma vs Pratha", null,
            null, null, null, null, null, null, null,
            new Block.DvpSplit("lead", "Named in text", List.of(), null,
                "Cultural, not text", List.of(), null),
            null, null);
        assertThat(ArticleTemplate.hasContent(empty)).isFalse();

        var filled = new Block(Block.BlockType.DHARMA_VS_PRATHA, "Dharma vs Pratha", null,
            null, null, null, null, null, null, null,
            new Block.DvpSplit("lead", "Named in text", List.of("The Ekadashi tithi"), null,
                "Cultural, not text", List.of(), null),
            null, null);
        assertThat(ArticleTemplate.hasContent(filled)).isTrue();
    }

    @Test
    void scaffoldRunsRequiredThenRecommendedInSpecOrder() {
        var scaffold = ArticleTemplate.of(ArticleType.RITUAL_GUIDE).scaffold();
        assertThat(scaffold).startsWith(Block.BlockType.VIDHI);
        assertThat(scaffold).contains(Block.BlockType.DHARMA_VS_PRATHA);
        assertThat(scaffold).doesNotHaveDuplicates();
    }
}
