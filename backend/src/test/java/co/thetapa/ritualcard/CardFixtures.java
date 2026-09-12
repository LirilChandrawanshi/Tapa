package co.thetapa.ritualcard;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleStatus;
import co.thetapa.content.ArticleType;
import co.thetapa.content.Block;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.PanchangDay;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Article/observance/panchang fixtures for the truth-table tests: three
 * hand-built shapes plus the real seed fixtures, addressed as
 * {@code "seed:<article-slug>"} and loaded from the repo's {@code seed/}
 * directory through the same Jackson mapping the seeder uses.
 */
final class CardFixtures {

    record Fixture(Article article, Observance observance, PanchangDay day) {
    }

    private static final ObjectMapper MAPPER = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

    private CardFixtures() {
    }

    static Fixture byName(String name) {
        if (name.startsWith("seed:")) {
            return fromSeed(name.substring("seed:".length()));
        }
        return switch (name) {
            case "sawanSomwar" -> sawanSomwar();
            case "nagPanchami" -> nagPanchami();
            case "ekadashi" -> ekadashi();
            default -> throw new IllegalArgumentException("unknown fixture: " + name);
        };
    }

    // ---- real seed fixtures -------------------------------------------------

    /** Loads seed/articles/&lt;slug&gt;.json + its linked observance + panchang day (if seeded). */
    static Fixture fromSeed(String slug) {
        Path root = seedRoot();
        try {
            Article article = MAPPER.readValue(root.resolve("articles/" + slug + ".json").toFile(),
                Article.class);
            Observance observance = null;
            if (article.getLinkedObservanceSlug() != null) {
                observance = Arrays.stream(MAPPER.readValue(
                        root.resolve("panchang/observances-2026.json").toFile(), Observance[].class))
                    .filter(o -> article.getLinkedObservanceSlug().equals(o.getSlug()))
                    .findFirst().orElse(null);
            }
            PanchangDay day = null;
            LocalDate date = observance != null ? observance.getDate() : article.getObservanceDate();
            if (date != null) {
                day = Arrays.stream(MAPPER.readValue(
                        root.resolve("panchang/days-sample.json").toFile(), PanchangDay[].class))
                    .filter(d -> date.equals(d.getDate()) && PanchangDay.DEFAULT_CITY.equals(d.getCity()))
                    .findFirst().orElse(null);
            }
            return new Fixture(article, observance, day);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot load seed fixture " + slug, e);
        }
    }

    private static Path seedRoot() {
        for (Path candidate : new Path[]{Path.of("../seed"), Path.of("seed")}) {
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("seed/ directory not found from " + Path.of("").toAbsolutePath());
    }

    /** Mirrors the seeded sawan-somwar-vrat article: samagri + mantra + fasting → all 7 blocks. */
    static Fixture sawanSomwar() {
        Observance obs = observance("sawan-somwar-2026", "Sawan Somwar Vrat", Observance.Type.VRAT,
            "sawan-somwar", LocalDate.of(2026, 9, 7), "Shravana Krishna Dashami");

        PanchangDay day = panchangDay(LocalDate.of(2026, 9, 7));
        day.setAbhijitMuhurat(new PanchangDay.TimeRange("11:52", "12:42"));

        List<Block> blocks = List.of(
            samagriBlock(List.of("Ganga Jal / clean water", "Belpatra", "Raw milk", "Diya + ghee",
                "White flowers", "Fruits + sweets"), null),
            vidhiBlock(List.of(
                step(1, "Bathe before sunrise and wear clean clothes", null),
                step(2, "Take the Somwar Vrat Sankalp facing east", null),
                step(3, "Abhishek of the Shivling with water and milk", null),
                step(4, "Offer belpatra, flowers and diya", null),
                step(5, "Evening aarti · break fast after sunset", null)), null),
            mantraBlock("ॐ नमः शिवाय", "Om Namah Shivaya", 108, List.of(11, 21, 51)),
            fastingBlock(List.of(
                new Block.FastingForm("Phalahar", "Fruits, milk and vrat food through the day.", true),
                new Block.FastingForm("Sajal", "With water; accepted for health reasons.", false)))
        );
        return new Fixture(article("sawan-somwar-vrat", "vrat-vidhis", "Sawan Somwar Vrat",
            obs.getSlug(), obs.getDate(), blocks), obs, day);
    }

    /** Nag-Panchami-like: no samagri, no mantra, fasting yes → 4 mandatory blocks + fasting. */
    static Fixture nagPanchami() {
        Observance obs = observance("nag-panchami-2026", "Nag Panchami", Observance.Type.FESTIVAL,
            null, LocalDate.of(2026, 8, 17), "Shravana Shukla Panchami");

        PanchangDay day = panchangDay(LocalDate.of(2026, 8, 17));
        day.setMuhurats(List.of(new PanchangDay.Muhurat("Puja Muhurat", "05:51", "08:27", "auspicious")));

        List<Block> blocks = List.of(
            vidhiBlock(List.of(
                step(1, "Clean the puja space and draw the Nag image", null),
                step(2, "Offer milk, haldi and flowers", null),
                step(3, "Evening aarti", null)), null),
            fastingBlock(List.of(
                new Block.FastingForm("Phalahar", "One meal without salt after the puja.", true)))
        );
        return new Fixture(article("nag-panchami", "festive-pujans", "Nag Panchami",
            obs.getSlug(), obs.getDate(), blocks), obs, day);
    }

    /** Ekadashi-like: all 7 blocks, Fast/Parana field set, two-group samagri, 10 steps (capped at 8). */
    static Fixture ekadashi() {
        Observance obs = observance("papankusha-ekadashi-2026", "Papankusha Ekadashi", Observance.Type.VRAT,
            "ekadashi", LocalDate.of(2026, 10, 21), "Ashwina Shukla Ekadashi");

        PanchangDay day = panchangDay(LocalDate.of(2026, 10, 21));

        List<Block.VidhiStep> steps = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            String note = i == 8 ? "day: Evening — parana prep" : null;
            String title = i == 9 ? "NEVER-RENDERED-STEP-9" : "Step " + i + " of the ekadashi vidhi";
            steps.add(step(i, title, note));
        }

        List<Block> blocks = List.of(
            samagriBlock(List.of("Vishnu idol / image", "Tulsi leaves", "Yellow flowers", "Diya + ghee",
                    "Fruits", "Panchamrit", "Sandalwood paste", "Yellow cloth"),
                Map.of("groupA", "For the altar", "groupB", "For the vrat")),
            vidhiBlock(steps, null),
            mantraBlock("ॐ नमो भगवते वासुदेवाय", "Om Namo Bhagavate Vasudevaya", 108, List.of(11, 21, 51)),
            fastingBlock(List.of(
                new Block.FastingForm("Nirjala", "No food or water until parana.", true),
                new Block.FastingForm("Phalahar", "Fruits and milk permitted for health reasons.", false)))
        );
        return new Fixture(article("papankusha-ekadashi", "vrat-vidhis", "Papankusha Ekadashi",
            obs.getSlug(), obs.getDate(), blocks), obs, day);
    }

    // ---- low-level builders -------------------------------------------------

    private static Article article(String slug, String subCategory, String title,
                                   String observanceSlug, LocalDate date, List<Block> blocks) {
        Article a = new Article();
        a.setSlug(slug);
        a.setType(ArticleType.RITUAL_GUIDE);
        a.setStatus(ArticleStatus.PUBLISHED);
        a.setCategory("ritual-guides");
        a.setSubCategory(subCategory);
        a.setObservanceDate(date);
        a.setLinkedObservanceSlug(observanceSlug);
        a.setLang(Map.of("en", new Article.ArticleContent(title, null, null, null, blocks, null)));
        return a;
    }

    private static Observance observance(String slug, String name, Observance.Type type,
                                         String series, LocalDate date, String tithiLabel) {
        Observance o = new Observance();
        o.setSlug(slug);
        o.setName(name);
        o.setType(type);
        o.setSeries(series);
        o.setDate(date);
        o.setTithiLabel(tithiLabel);
        return o;
    }

    private static PanchangDay panchangDay(LocalDate date) {
        PanchangDay d = new PanchangDay();
        d.setDate(date);
        d.setCity(PanchangDay.DEFAULT_CITY);
        return d;
    }

    private static Block samagriBlock(List<String> items, Map<String, String> meta) {
        List<Block.SamagriItem> samagri = items.stream()
            .map(n -> new Block.SamagriItem(n, null, false)).toList();
        return new Block(Block.BlockType.SAMAGRI, "Samagri", null, null, samagri,
            null, null, null, null, null, null, null, meta);
    }

    private static Block vidhiBlock(List<Block.VidhiStep> steps, Map<String, String> meta) {
        return new Block(Block.BlockType.VIDHI, "Vidhi", null, steps, null,
            null, null, null, null, null, null, null, meta);
    }

    private static Block mantraBlock(String devanagari, String translit, int defaultCount, List<Integer> presets) {
        return new Block(Block.BlockType.MANTRA, "Mantra", null, null, null, null,
            new Block.Mantra(devanagari, translit, null, defaultCount, presets, null, null),
            null, null, null, null, null, null);
    }

    private static Block fastingBlock(List<Block.FastingForm> forms) {
        return new Block(Block.BlockType.FASTING, "Fasting", null, null, null,
            null, null, null, forms, null, null, null, null);
    }

    private static Block.VidhiStep step(int number, String title, String note) {
        return new Block.VidhiStep(number, title, null, note, null, null, false);
    }
}
