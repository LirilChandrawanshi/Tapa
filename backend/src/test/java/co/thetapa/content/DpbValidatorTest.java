package co.thetapa.content;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DpbValidatorTest {

    private DpbValidator validator;

    @BeforeEach
    void setUp() {
        validator = new DpbValidator();
    }

    private Article article(Dpb dpb) {
        Article a = new Article();
        a.setSlug("test");
        a.setDpb(dpb);
        a.setLang(Map.of("en", new Article.ArticleContent("Title", null, null, null, List.of(), null)));
        return a;
    }

    @Test
    void dharmaWithNamedSourceAndHighScorePasses() {
        var a = article(new Dpb(DpbTag.DHARMA, 4, "Shiva Purana", "Rudra Samhita", "PURANIC", null, null));
        assertThat(validator.validate(a)).isEmpty();
    }

    @Test
    void dharmaBelowScoreThreeIsRejected() {
        var a = article(new Dpb(DpbTag.DHARMA, 2, "Shiva Purana", null, null, null, null));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("can never be DHARMA"));
    }

    @Test
    void dharmaWithoutNamedSourceIsRejected() {
        var a = article(new Dpb(DpbTag.DHARMA, 4, " ", null, null, null, null));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("named scripture"));
    }

    @Test
    void prathaAboveScoreTwoIsRejected() {
        var a = article(new Dpb(DpbTag.PRATHA, 3, null, null, null, null, "North India"));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("1–2"));
    }

    @Test
    void prathaWithoutScopeIsRejected() {
        var a = article(new Dpb(DpbTag.PRATHA, 2, null, null, null, null, null));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("regional scope"));
    }

    @Test
    void bhrantiWithScoreIsRejected() {
        var a = article(new Dpb(DpbTag.BHRANTI, 3, null, null, null, null, null));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("no confidence score"));
    }

    @Test
    void bhrantiWithoutScorePasses() {
        var a = article(new Dpb(DpbTag.BHRANTI, null, null, null, null, null, null));
        assertThat(validator.validate(a)).isEmpty();
    }

    @Test
    void missingClassificationIsRejected() {
        var a = article(null);
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("must carry a DPB classification"));
    }

    @Test
    void perStepTagsAreValidated() {
        var badStep = new Block.VidhiStep(1, "Step", null, null,
            new Dpb(DpbTag.DHARMA, 1, "Shiva Purana", null, null, null, null), null);
        var vidhi = new Block(Block.BlockType.VIDHI, "Vidhi", null, List.of(badStep),
            null, null, null, null, null, null);
        Article a = article(new Dpb(DpbTag.DHARMA, 4, "Shiva Purana", null, null, null, null));
        a.setLang(Map.of("en", new Article.ArticleContent("Title", null, null, null, List.of(vidhi), null)));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("vidhi step 1"));
    }

    @Test
    void samagriOverEightItemsIsRejected() {
        var items = java.util.stream.IntStream.rangeClosed(1, 9)
            .mapToObj(i -> new Block.SamagriItem("Item " + i, null, false))
            .toList();
        var samagri = new Block(Block.BlockType.SAMAGRI, "Samagri", null, null,
            items, null, null, null, null, null);
        Article a = article(new Dpb(DpbTag.DHARMA, 4, "Shiva Purana", null, null, null, null));
        a.setLang(Map.of("en", new Article.ArticleContent("Title", null, null, null, List.of(samagri), null)));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("at most 8 items"));
    }

    @Test
    void circleTeaserOver100CharsIsRejected() {
        Article a = article(new Dpb(DpbTag.DHARMA, 4, "Shiva Purana", null, null, null, null));
        a.setCircleTeaser("x".repeat(101));
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("circle_teaser"));
    }

    @Test
    void englishTitleIsRequired() {
        Article a = article(new Dpb(DpbTag.DHARMA, 4, "Shiva Purana", null, null, null, null));
        a.setLang(Map.of());
        assertThat(validator.validate(a))
            .anyMatch(e -> e.contains("English content"));
    }
}
