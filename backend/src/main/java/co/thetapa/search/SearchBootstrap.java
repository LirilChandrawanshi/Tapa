package co.thetapa.search;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SearchBootstrap {

    private final PopularSearchRepository popular;

    public SearchBootstrap(PopularSearchRepository popular) {
        this.popular = popular;
    }

    @PostConstruct
    void seedDefaults() {
        if (popular.count() > 0) {
            return;
        }
        record Entry(String label, String url) {
        }
        List<Entry> defaults = List.of(
            new Entry("Sawan Somwar", "/search?q=sawan+somwar"),
            new Entry("Ekadashi Vrat", "/search?q=ekadashi"),
            new Entry("Hartalika Teej", "/search?q=hartalika+teej"),
            new Entry("Navratri 2026", "/search?q=navratri"),
            new Entry("Karwa Chauth", "/search?q=karwa+chauth"),
            new Entry("Diwali", "/search?q=diwali")
        );
        for (int i = 0; i < defaults.size(); i++) {
            var p = new SearchModels.PopularSearch();
            p.label = defaults.get(i).label();
            p.targetUrl = defaults.get(i).url();
            p.order = i + 1;
            popular.save(p);
        }
    }
}
