package co.thetapa.search;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

public final class SearchModels {

    private SearchModels() {
    }

    /** One search result row. */
    public record Hit(String resultType, String title, String subtitle, String href,
                      String hueClass, String badge) {
        public static final String TYPE_GLOSSARY = "glossary";
        public static final String TYPE_GUIDE = "guide";
        public static final String TYPE_DATE = "date";
        public static final String TYPE_KIT = "kit";
    }

    /**
     * Grouped response. Hard ranking rule (PRD): glossary definition first,
     * then guides, then dates, then kits — knowledge before commerce.
     */
    public record SearchResponse(String query, int totalCount,
                                 List<Hit> glossary, List<Hit> guides,
                                 List<Hit> dates, List<Hit> kits,
                                 List<String> didYouMean, List<PopularSearch> popular) {
    }

    /** Every query is logged; zero-result queries are an editorial backlog signal. */
    @Document("search_queries")
    public static class SearchQuery {

        @Id
        public String id;
        public String query;
        @Indexed
        public String normalizedQuery;
        @Indexed
        public int resultCount;
        @CreatedDate
        public Instant at;
    }

    /** Curated chips shown on empty states and the search landing. */
    @Document("popular_searches")
    public static class PopularSearch {

        @Id
        public String id;
        public String label;
        public String targetUrl;
        public int order;
        public boolean active = true;
    }
}
