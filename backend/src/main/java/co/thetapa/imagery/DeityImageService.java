package co.thetapa.imagery;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resolves the picture an observance shows, and keeps the deity image sets the
 * fallback leans on.
 */
@Service
public class DeityImageService {

    private final DeityImagesRepository repository;
    private final ObservanceRepository observances;
    private final ArticleRepository articles;

    public DeityImageService(DeityImagesRepository repository,
                             ObservanceRepository observances,
                             ArticleRepository articles) {
        this.repository = repository;
        this.articles = articles;
        this.observances = observances;
    }

    /** Deity names are entered by hand, so match on a normalised key. */
    static String key(String deity) {
        return deity == null ? "" : deity.trim().toLowerCase();
    }

    /**
     * The image for one observance, in order of how specific it is:
     *
     * <ol>
     *   <li>the observance's own {@code heroImageId} — an override for the
     *       handful of dates that deserve their own artwork,</li>
     *   <li>the linked guide's hero image — already uploaded, already about
     *       this exact festival, so it beats a generic one,</li>
     *   <li>the deity's set — the part that scales, and the only part that
     *       covers a date nobody has touched,</li>
     *   <li>null, and the card keeps the deity gradient it has today.</li>
     * </ol>
     */
    public String imageFor(Observance o) {
        if (o == null) {
            return null;
        }
        if (notBlank(o.getHeroImageId())) {
            return o.getHeroImageId();
        }
        if (notBlank(o.getArticleSlug())) {
            Article guide = articles.findBySlug(o.getArticleSlug()).orElse(null);
            if (guide != null && notBlank(guide.getHeroImageId())) {
                return guide.getHeroImageId();
            }
        }
        return assignments().get(o.getSlug());
    }

    /**
     * Which image each date takes from its deity's set, worked out once for the
     * whole calendar.
     *
     * <p>Round-robin down the deity's dates in date order, rather than hashing
     * the slug. Hashing looked tidier but clumped: six Ekadashis over six
     * Vishnu images landed on four of them, so two dates shared a picture while
     * two uploads were never seen. Walking the list in order spends every image
     * before repeating any, and guarantees that dates next to each other on the
     * shelf never match.</p>
     */
    @Cacheable("deity-assignments")
    public Map<String, String> assignments() {
        Map<String, List<String>> sets = allSets();
        Map<String, List<Observance>> byDeity = new LinkedHashMap<>();
        for (Observance o : observances.findAll()) {
            String k = key(o.getDeity());
            if (!k.isEmpty() && !sets.getOrDefault(k, List.of()).isEmpty()) {
                byDeity.computeIfAbsent(k, x -> new ArrayList<>()).add(o);
            }
        }
        Map<String, String> out = new LinkedHashMap<>();
        for (Map.Entry<String, List<Observance>> e : byDeity.entrySet()) {
            List<String> set = sets.get(e.getKey());
            List<Observance> dates = new ArrayList<>(e.getValue());
            // date order, slug as the tie-break so the result never depends on
            // what Mongo happened to return first
            dates.sort(Comparator.comparing(Observance::getDate)
                .thenComparing(Observance::getSlug));
            for (int i = 0; i < dates.size(); i++) {
                out.put(dates.get(i).getSlug(), set.get(i % set.size()));
            }
        }
        return out;
    }

    /**
     * The picture a guide shows on a listing card.
     *
     * <p>Its own hero image first. Failing that, the observance that links to
     * it lends its imagery — a guide about Aja Ekadashi and the Aja Ekadashi
     * date are the same subject, so they should not look like different ones.
     * Guides with no date behind them keep their gradient.</p>
     */
    public String imageForArticle(Article a) {
        if (a == null) {
            return null;
        }
        if (notBlank(a.getHeroImageId())) {
            return a.getHeroImageId();
        }
        return observances.findByArticleSlug(a.getSlug())
            .map(this::imageFor)
            .orElse(null);
    }

    @Cacheable("deity-images")
    public Map<String, List<String>> allSets() {
        Map<String, List<String>> out = new LinkedHashMap<>();
        for (DeityImages d : repository.findAll()) {
            out.put(d.getDeity(), d.getImageIds());
        }
        return out;
    }

    /** One row per deity actually present in the calendar — never a fixed list. */
    public record DeityRow(String deity, String label, List<String> imageIds,
                           int observanceCount, List<String> examples) {
    }

    public List<DeityRow> rows() {
        Map<String, List<String>> sets = allSets();
        Map<String, String> labels = new LinkedHashMap<>();
        Map<String, List<String>> names = new LinkedHashMap<>();

        for (Observance o : observances.findAll()) {
            String k = key(o.getDeity());
            if (k.isEmpty()) {
                continue;
            }
            labels.putIfAbsent(k, o.getDeity().trim());
            names.computeIfAbsent(k, x -> new ArrayList<>()).add(o.getName());
        }
        // a set an editor filled for a deity no longer in the calendar still shows,
        // so the images are not silently orphaned
        for (String k : sets.keySet()) {
            labels.putIfAbsent(k, k);
        }

        List<DeityRow> rows = new ArrayList<>();
        for (Map.Entry<String, String> e : labels.entrySet()) {
            List<String> used = names.getOrDefault(e.getKey(), List.of());
            rows.add(new DeityRow(
                e.getKey(),
                e.getValue(),
                sets.getOrDefault(e.getKey(), List.of()),
                used.size(),
                used.stream().distinct().sorted().limit(4).toList()));
        }
        // busiest deities first — that is where an image earns the most
        rows.sort(Comparator.comparingInt(DeityRow::observanceCount).reversed()
            .thenComparing(DeityRow::label));
        return rows;
    }

    @CacheEvict(value = {"deity-images", "deity-assignments", "home"}, allEntries = true)
    public DeityImages save(String deity, List<String> imageIds) {
        String k = key(deity);
        DeityImages row = repository.findByDeity(k).orElseGet(DeityImages::new);
        row.setDeity(k);
        row.setImageIds(imageIds == null ? List.of()
            : imageIds.stream().filter(DeityImageService::notBlank).distinct().toList());
        return repository.save(row);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
