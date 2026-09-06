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
    private final ObjectMapper mapper;

    public SeedRunner(ArticleRepository articles, GlossaryRepository glossary,
                      co.thetapa.content.DpbValidator dpbValidator, ObjectMapper mapper) {
        this.articles = articles;
        this.glossary = glossary;
        this.dpbValidator = dpbValidator;
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

    private boolean editedAfter(java.time.Instant dbUpdatedAt, Path fixture) {
        try {
            return dbUpdatedAt != null
                && dbUpdatedAt.isAfter(Files.getLastModifiedTime(fixture).toInstant());
        } catch (IOException e) {
            return false;
        }
    }
}
