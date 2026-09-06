package co.thetapa.config;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.glossary.GlossaryTerm;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

/**
 * Loads /seed JSON fixtures through the real document models so validation and
 * index constraints exercise the same code paths as the admin API.
 *
 * Idempotent: upserts by natural key (slug); a fixture never clobbers a document
 * an editor has since touched (DB updatedAt newer than the fixture file's mtime).
 *
 * Run with: mvn spring-boot:run -Dspring-boot.run.arguments=--seed
 */
@Component
public class SeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final ArticleRepository articles;
    private final GlossaryRepository glossary;
    private final co.thetapa.content.DpbValidator dpbValidator;
    private final co.thetapa.panchang.ObservanceRepository observanceRepo;
    private final co.thetapa.panchang.PanchangDayRepository panchangDayRepo;
    private final co.thetapa.commerce.ProductRepository productRepo;
    private final co.thetapa.commerce.PincodeRepository pincodeRepo;
    private final co.thetapa.booking.PujaTypeRepository pujaTypeRepo;
    private final co.thetapa.booking.PurohitRepository purohitRepo;
    private final co.thetapa.mandali.MandaliTypeRepository mandaliTypeRepo;
    private final ObjectMapper mapper;

    public SeedRunner(ArticleRepository articles, GlossaryRepository glossary,
                      co.thetapa.content.DpbValidator dpbValidator,
                      co.thetapa.panchang.ObservanceRepository observanceRepo,
                      co.thetapa.panchang.PanchangDayRepository panchangDayRepo,
                      co.thetapa.commerce.ProductRepository productRepo,
                      co.thetapa.commerce.PincodeRepository pincodeRepo,
                      co.thetapa.booking.PujaTypeRepository pujaTypeRepo,
                      co.thetapa.booking.PurohitRepository purohitRepo,
                      co.thetapa.mandali.MandaliTypeRepository mandaliTypeRepo,
                      ObjectMapper mapper) {
        this.articles = articles;
        this.glossary = glossary;
        this.dpbValidator = dpbValidator;
        this.observanceRepo = observanceRepo;
        this.panchangDayRepo = panchangDayRepo;
        this.productRepo = productRepo;
        this.pincodeRepo = pincodeRepo;
        this.pujaTypeRepo = pujaTypeRepo;
        this.purohitRepo = purohitRepo;
        this.mandaliTypeRepo = mandaliTypeRepo;
        this.mapper = mapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!args.containsOption("seed")) {
            return;
        }
        Path seedRoot = findSeedRoot();
        if (seedRoot == null) {
            log.warn("--seed given but no seed/ directory found");
            return;
        }
        seedArticles(seedRoot.resolve("articles"));
        seedGlossary(seedRoot.resolve("glossary"));
        seedPanchang(seedRoot.resolve("panchang"));
        seedProducts(seedRoot.resolve("products"));
        seedBooking(seedRoot.resolve("booking"));
        seedMandali(seedRoot.resolve("mandali"));
        log.info("Seeding complete");
    }

    private Path findSeedRoot() {
        for (Path candidate : new Path[]{Path.of("../seed"), Path.of("seed")}) {
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private void seedArticles(Path dir) throws IOException {
        if (!Files.isDirectory(dir)) {
            return;
        }
        try (Stream<Path> files = Files.list(dir)) {
            files.filter(p -> p.toString().endsWith(".json")).sorted().forEach(path -> {
                try {
                    Article fixture = mapper.readValue(path.toFile(), Article.class);
                    if (fixture.getStatus() == co.thetapa.content.ArticleStatus.PUBLISHED) {
                        var errors = dpbValidator.validate(fixture);
                        if (!errors.isEmpty()) {
                            throw new IllegalStateException(
                                "Fixture " + path.getFileName() + " fails DPB validation: " + errors);
                        }
                    }
                    var existing = articles.findBySlug(fixture.getSlug());
                    if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), path)) {
                        log.info("skip article {} (edited since fixture)", fixture.getSlug());
                        return;
                    }
                    existing.ifPresent(a -> fixture.setId(a.getId()));
                    articles.save(fixture);
                    log.info("seeded article {}", fixture.getSlug());
                } catch (IOException e) {
                    throw new IllegalStateException("Bad article fixture " + path, e);
                }
            });
        }
    }

    private void seedGlossary(Path dir) throws IOException {
        Path file = dir.resolve("terms.json");
        if (!Files.exists(file)) {
            return;
        }
        GlossaryTerm[] terms = mapper.readValue(file.toFile(), GlossaryTerm[].class);
        for (GlossaryTerm fixture : terms) {
            var existing = glossary.findBySlug(fixture.getSlug());
            if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), file)) {
                continue;
            }
            existing.ifPresent(t -> {
                fixture.setId(t.getId());
                fixture.setLookupCount(t.getLookupCount());
            });
            glossary.save(fixture);
        }
        log.info("seeded {} glossary terms", terms.length);
    }

    private void seedPanchang(Path dir) throws IOException {
        Path observancesFile = dir.resolve("observances-2026.json");
        if (Files.exists(observancesFile)) {
            var fixtures = mapper.readValue(observancesFile.toFile(),
                co.thetapa.panchang.Observance[].class);
            for (var fixture : fixtures) {
                var existing = observanceRepo.findBySlug(fixture.getSlug());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), observancesFile)) {
                    continue;
                }
                existing.ifPresent(o -> fixture.setId(o.getId()));
                observanceRepo.save(fixture);
            }
            log.info("seeded {} observances", fixtures.length);
        }
        Path daysFile = dir.resolve("days-sample.json");
        if (Files.exists(daysFile)) {
            var fixtures = mapper.readValue(daysFile.toFile(),
                co.thetapa.panchang.PanchangDay[].class);
            for (var fixture : fixtures) {
                var existing = panchangDayRepo.findByDateAndCity(fixture.getDate(), fixture.getCity());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), daysFile)) {
                    continue;
                }
                existing.ifPresent(d -> fixture.setId(d.getId()));
                panchangDayRepo.save(fixture);
            }
            log.info("seeded {} panchang days", fixtures.length);
        }
    }

    private void seedProducts(Path dir) throws IOException {
        Path file = dir.resolve("products.json");
        if (Files.exists(file)) {
            var fixtures = mapper.readValue(file.toFile(), co.thetapa.commerce.Product[].class);
            for (var fixture : fixtures) {
                var existing = productRepo.findBySlug(fixture.getSlug());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), file)) {
                    continue;
                }
                existing.ifPresent(p -> fixture.setId(p.getId()));
                productRepo.save(fixture);
            }
            log.info("seeded {} products", fixtures.length);
        }
        // launch serviceability: a starter Delhi-NCR pincode set, admin-extendable
        if (pincodeRepo.count() == 0) {
            String[][] pins = {
                {"110001", "Connaught Place"}, {"110016", "Hauz Khas"}, {"110017", "Malviya Nagar"},
                {"110024", "Lajpat Nagar"}, {"110048", "Greater Kailash"}, {"110085", "Rohini"},
                {"201301", "Noida Sec 1-12"}, {"201303", "Noida Sec 44"}, {"122002", "Gurugram DLF"},
                {"122018", "Gurugram Sec 56"}, {"121001", "Faridabad"}, {"201010", "Ghaziabad"}
            };
            for (String[] pin : pins) {
                pincodeRepo.save(new co.thetapa.commerce.PincodeServiceability(pin[0], true, 3, pin[1]));
            }
            log.info("seeded {} serviceable pincodes", pins.length);
        }
    }

    private void seedBooking(Path dir) throws IOException {
        Path pujasFile = dir.resolve("puja-types.json");
        if (Files.exists(pujasFile)) {
            var fixtures = mapper.readValue(pujasFile.toFile(), co.thetapa.booking.PujaType[].class);
            for (var fixture : fixtures) {
                var existing = pujaTypeRepo.findBySlug(fixture.getSlug());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), pujasFile)) {
                    continue;
                }
                existing.ifPresent(p -> fixture.setId(p.getId()));
                pujaTypeRepo.save(fixture);
            }
            log.info("seeded {} puja types", fixtures.length);
        }
        Path purohitsFile = dir.resolve("purohits.json");
        if (Files.exists(purohitsFile)) {
            var fixtures = mapper.readValue(purohitsFile.toFile(), co.thetapa.booking.Purohit[].class);
            for (var fixture : fixtures) {
                var existing = purohitRepo.findBySlug(fixture.getSlug());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), purohitsFile)) {
                    continue;
                }
                existing.ifPresent(p -> fixture.setId(p.getId()));
                purohitRepo.save(fixture);
            }
            log.info("seeded {} purohits", fixtures.length);
        }
    }

    private void seedMandali(Path dir) throws IOException {
        // NOTE: startingPricePaise in the fixture (except sundarkand's locked
        // ₹4,500) are working numbers pending Komal's sign-off — adjust via the
        // admin mandali-types editor, not by re-seeding.
        Path typesFile = dir.resolve("mandali-types.json");
        if (Files.exists(typesFile)) {
            var fixtures = mapper.readValue(typesFile.toFile(), co.thetapa.mandali.MandaliType[].class);
            for (var fixture : fixtures) {
                var existing = mandaliTypeRepo.findBySlug(fixture.getSlug());
                if (existing.isPresent() && editedAfter(existing.get().getUpdatedAt(), typesFile)) {
                    continue;
                }
                existing.ifPresent(t -> fixture.setId(t.getId()));
                mandaliTypeRepo.save(fixture);
            }
            log.info("seeded {} mandali types", fixtures.length);
        }
    }

    private boolean editedAfter(java.time.Instant dbUpdatedAt, Path fixture) {
        try {
            return dbUpdatedAt != null
                && dbUpdatedAt.isAfter(Files.getLastModifiedTime(fixture).toInstant());
        } catch (IOException e) {
            return false;
        }
    }
}
