package co.thetapa.homesections;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads and writes the editable homepage bands, and plants the current copy
 * on first boot so the switch to CMS control is a no-op on the page itself.
 */
@Service
public class HomeSectionService {

    private static final Logger log = LoggerFactory.getLogger(HomeSectionService.class);

    private final HomeSectionRepository repository;
    private final ApplicationEventPublisher events;

    public HomeSectionService(HomeSectionRepository repository,
                              ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    /** Fired on every save so the ISR cache and the "home" payload both refresh. */
    public record HomeSectionChangedEvent(String key) {
    }

    /**
     * Inserts any seed key the collection is missing. Existing rows are left
     * exactly as they are — an editor's words always win over the defaults.
     */
    @PostConstruct
    void seedMissing() {
        int planted = 0;
        for (HomeSection candidate : HomeSectionSeed.defaults()) {
            if (repository.findByKey(candidate.getKey()).isEmpty()) {
                repository.save(candidate);
                planted++;
            }
        }
        if (planted > 0) {
            log.info("home sections: seeded {} missing band(s) with their current copy", planted);
        }
    }

    /**
     * Every band keyed by its identifier, for the composed home payload —
     * unpublished ones included, carrying {@code published:false}.
     *
     * <p>Sending them is deliberate. The frontend has to tell "an editor hid
     * this band" apart from "this band is not in the collection at all": the
     * first must hide the band, the second must fall back to the component's
     * built-in copy so a downed API never blanks the page. Filtering here
     * would collapse the two into one indistinguishable case.</p>
     */
    @Cacheable("home-sections")
    public Map<String, HomeSection> publicMap() {
        Map<String, HomeSection> out = new LinkedHashMap<>();
        for (HomeSection s : all()) {
            out.put(s.getKey(), s);
        }
        return out;
    }

    /** Admin list — published and unpublished alike, in seed order. */
    public List<HomeSection> all() {
        List<String> order = HomeSectionSeed.defaults().stream().map(HomeSection::getKey).toList();
        return repository.findAll().stream()
            .sorted((a, b) -> Integer.compare(indexOf(order, a.getKey()), indexOf(order, b.getKey())))
            .toList();
    }

    private static int indexOf(List<String> order, String key) {
        int i = order.indexOf(key);
        return i < 0 ? Integer.MAX_VALUE : i;
    }

    @CacheEvict(value = {"home-sections", "home"}, allEntries = true)
    public HomeSection save(String key, HomeSection body) {
        HomeSection existing = repository.findByKey(key).orElseGet(HomeSection::new);
        existing.setKey(key);
        if (body.getLabel() != null) {
            existing.setLabel(body.getLabel());
        }
        existing.setPublished(body.isPublished());
        existing.setFields(body.getFields());
        existing.setItems(body.getItems());
        HomeSection saved = repository.save(existing);
        events.publishEvent(new HomeSectionChangedEvent(key));
        return saved;
    }

    /** Restores one band to the copy it shipped with. */
    @CacheEvict(value = {"home-sections", "home"}, allEntries = true)
    public HomeSection reset(String key) {
        HomeSection seed = HomeSectionSeed.defaults().stream()
            .filter(s -> s.getKey().equals(key))
            .findFirst()
            .orElseThrow(() -> new co.thetapa.common.NotFoundException("home section", key));
        repository.findByKey(key).ifPresent(existing -> seed.setId(existing.getId()));
        HomeSection saved = repository.save(seed);
        events.publishEvent(new HomeSectionChangedEvent(key));
        return saved;
    }
}
