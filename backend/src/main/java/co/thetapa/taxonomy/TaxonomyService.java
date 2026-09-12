package co.thetapa.taxonomy;

import jakarta.annotation.PostConstruct;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaxonomyService {

    private final TaxonomyRepository repository;
    private final ApplicationEventPublisher events;

    public TaxonomyService(TaxonomyRepository repository, ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    @PostConstruct
    void bootstrap() {
        if (repository.existsById(Taxonomy.SINGLETON_ID)) {
            return;
        }
        Taxonomy taxonomy = new Taxonomy();
        taxonomy.setPillars(List.of(
            new Taxonomy.Pillar("ritual-guides", "Ritual Guides", "अनुष्ठान मार्गदर्शिका",
                "/ritual-guides", null, "rg", List.of(
                new Taxonomy.Node("beginners-guides", "Beginner's Guides", "प्रारंभिक मार्गदर्शिका", "/ritual-guides/beginners-guides", 1),
                new Taxonomy.Node("festive-pujans", "Festive Pujans", "पर्व पूजन", "/ritual-guides/festive-pujans", 2),
                new Taxonomy.Node("all-year-pujans", "All-Year Pujans", "वार्षिक पूजन", "/ritual-guides/all-year-pujans", 3),
                new Taxonomy.Node("sanskar-life-events", "Sanskar & Life Events", "संस्कार", "/ritual-guides/sanskar-life-events", 4))),
            new Taxonomy.Pillar("panchang", "Panchang", "पंचांग",
                "/panchang", null, "pa", List.of(
                new Taxonomy.Node("today", "Today's Panchang", "आज का पंचांग", "/panchang", 1),
                new Taxonomy.Node("vrat-calendar", "Vrat Calendar", "व्रत कैलेंडर", "/panchang/vrat-calendar", 2),
                new Taxonomy.Node("festival-calendar", "Festival Calendar", "पर्व कैलेंडर", "/panchang/festival-calendar", 3),
                new Taxonomy.Node("tithi-paksha", "Tithi & Paksha", "तिथि और पक्ष", "/panchang/tithi-paksha", 4),
                new Taxonomy.Node("eclipses", "Eclipses", "ग्रहण", "/panchang/eclipses", 5))),
            new Taxonomy.Pillar("dharmic-concepts", "Dharmic Concepts", "धार्मिक अवधारणाएँ",
                "/dharmic-concepts", null, "dc", List.of(
                new Taxonomy.Node("materials", "Materials", "सामग्री", "/dharmic-concepts/materials", 1),
                new Taxonomy.Node("meanings-practices", "Meanings & Practices", "अर्थ और अभ्यास", "/dharmic-concepts/meanings-practices", 2),
                new Taxonomy.Node("daily-puja", "Daily Puja", "नित्य पूजा", "/dharmic-concepts/daily-puja", 3),
                new Taxonomy.Node("dharma-vs-pratha", "Dharma vs Pratha", "धर्म बनाम प्रथा", "/dharmic-concepts/dharma-vs-pratha", 4),
                new Taxonomy.Node("mantras", "Mantras", "मंत्र", "/dharmic-concepts/mantras", 5))),
            new Taxonomy.Pillar("ritual-pujans", "Ritual Pujans", "पूजन सामग्री",
                "/ritual-pujans", "kits_launched", "rk", List.of(
                new Taxonomy.Node("by-festival", "By Festival", "पर्व अनुसार", "/ritual-pujans/by-festival", 1),
                new Taxonomy.Node("by-ritual", "By Ritual", "अनुष्ठान अनुसार", "/ritual-pujans/by-ritual", 2),
                new Taxonomy.Node("griha-life-events", "Griha & Life Events", "गृह और संस्कार", "/ritual-pujans/griha-life-events", 3),
                new Taxonomy.Node("daily-puja-essentials", "Daily Puja Essentials", "नित्य पूजा सामग्री", "/ritual-pujans/daily-puja-essentials", 4)))
        ));
        repository.save(taxonomy);
    }

    @Cacheable("taxonomy")
    public Taxonomy get() {
        return repository.findById(Taxonomy.SINGLETON_ID).orElseThrow();
    }

    @CacheEvict(value = "taxonomy", allEntries = true)
    public Taxonomy save(Taxonomy taxonomy) {
        taxonomy.setId(Taxonomy.SINGLETON_ID);
        Taxonomy saved = repository.save(taxonomy);
        events.publishEvent(new TaxonomyChangedEvent());
        return saved;
    }

    public record TaxonomyChangedEvent() {}
}
