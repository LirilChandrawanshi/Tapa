package co.thetapa.circle;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleStatus;
import co.thetapa.panchang.Observance;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** T2 tapa_circle_reminder variable building rules (TapaCircle_WhatsApp_Spec_v2). */
class CircleTemplateVarsTest {

    private static final String SITE = "https://thetapaco.com";
    private static final String MEDIA = "https://thetapaco.com/media";

    private static Observance observance() {
        Observance o = new Observance();
        o.setSlug("karwa-chauth-2026");
        o.setName("Karwa Chauth");
        o.setDate(LocalDate.of(2026, 10, 11));
        o.setTithiStartsAt("2026-10-10T18:12");   // starts the previous evening
        o.setTithiEndsAt("2026-10-11T20:04");
        o.setCircleTeaser("Moonrise fast for marital bliss");
        o.setVerified(true);
        return o;
    }

    private static Article publishedGuide() {
        Article a = new Article();
        a.setSlug("karwa-chauth-vrat-vidhi");
        a.setSubCategory("festive-pujans");
        a.setStatus(ArticleStatus.PUBLISHED);
        a.setWaImageId("img-wa-800x418");
        a.setHeroImageId("img-hero");
        return a;
    }

    @Test
    void buildsAllSevenVarsWithGuide() {
        Map<String, String> vars = CircleTemplateVars.reminderVars(observance(), publishedGuide(), SITE);

        assertThat(vars.get("1")).isEqualTo("Sunday, 11 October");
        assertThat(vars.get("2")).isEqualTo("Karwa Chauth");
        assertThat(vars.get("3")).isEqualTo("6:12 PM, 10 October"); // previous-day start → date appended
        assertThat(vars.get("4")).isEqualTo("8:04 PM");             // same-day end → time only
        assertThat(vars.get("5")).isEqualTo("Moonrise fast for marital bliss");
        assertThat(vars.get("6")).isEqualTo(SITE + "/ritual-guides/festive-pujans/karwa-chauth-vrat-vidhi");
        assertThat(vars.get("7")).isEqualTo(SITE + "/ritual-pujans");
    }

    @Test
    void sameDayTithiStartHasNoDateSuffix() {
        Observance o = observance();
        o.setTithiStartsAt("2026-10-11T06:30");
        assertThat(CircleTemplateVars.reminderVars(o, null, SITE).get("3")).isEqualTo("6:30 AM");
    }

    @Test
    void blankTeaserIsOmittedEntirely() {
        Observance o = observance();
        o.setCircleTeaser("   ");
        assertThat(CircleTemplateVars.reminderVars(o, null, SITE)).doesNotContainKey("5");

        o.setCircleTeaser(null);
        assertThat(CircleTemplateVars.reminderVars(o, null, SITE)).doesNotContainKey("5");
    }

    @Test
    void teaserIsCappedAtHundredChars() {
        Observance o = observance();
        o.setCircleTeaser("x".repeat(150));
        assertThat(CircleTemplateVars.reminderVars(o, null, SITE).get("5")).hasSize(100);
    }

    @Test
    void guideUrlFallsBackWhenNoOrUnpublishedArticle() {
        assertThat(CircleTemplateVars.reminderVars(observance(), null, SITE).get("6"))
            .isEqualTo(SITE + "/ritual-guides");

        Article draft = publishedGuide();
        draft.setStatus(ArticleStatus.DRAFT);
        assertThat(CircleTemplateVars.reminderVars(observance(), draft, SITE).get("6"))
            .isEqualTo(SITE + "/ritual-guides");
    }

    @Test
    void headerImageUsesWaVariantThenHeroAndOmitsWithoutGuide() {
        assertThat(CircleTemplateVars.headerImageUrl(publishedGuide(), MEDIA))
            .isEqualTo(MEDIA + "/img-wa-800x418");

        Article heroOnly = publishedGuide();
        heroOnly.setWaImageId(null);
        assertThat(CircleTemplateVars.headerImageUrl(heroOnly, MEDIA))
            .isEqualTo(MEDIA + "/img-hero");

        assertThat(CircleTemplateVars.headerImageUrl(null, MEDIA)).isNull();

        Article unpublished = publishedGuide();
        unpublished.setStatus(ArticleStatus.REVIEW);
        assertThat(CircleTemplateVars.headerImageUrl(unpublished, MEDIA)).isNull();
    }

    @Test
    void missingTithiValuesDegradeGracefully() {
        Observance o = observance();
        o.setTithiStartsAt(null);
        o.setTithiEndsAt("not-a-date");
        Map<String, String> vars = CircleTemplateVars.reminderVars(o, null, SITE);
        assertThat(vars.get("3")).isEqualTo("—");
        assertThat(vars.get("4")).isEqualTo("not-a-date");
    }

    @Test
    void welcomeVarsNameFirstUpcomingOccasion() {
        Map<String, String> vars = CircleTemplateVars.welcomeVars(observance());
        assertThat(vars.get("1")).isEqualTo("Karwa Chauth");
        assertThat(vars.get("2")).isEqualTo("Sunday, 11 October");

        assertThat(CircleTemplateVars.welcomeVars(null)).containsKeys("1", "2");
    }
}
