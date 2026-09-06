package co.thetapa.taxonomy;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * Singleton nav/taxonomy tree (newest Aug-30 spec). Sub-categories live inside
 * their pillar; siblings render in-page ("IN THIS CATEGORY" rail), never in top nav.
 */
@Document("taxonomy")
public class Taxonomy {

    public static final String SINGLETON_ID = "nav";

    @Id
    private String id = SINGLETON_ID;

    private List<Pillar> pillars;

    public record Pillar(
        String key,           // "ritual-guides"
        String labelEn,
        String labelHi,
        String href,
        String gateFlag,      // feature-flag key gating this pillar (null = always on)
        String heroClass,     // CategoryHero gradient variant: rg | pa | dc | rk
        List<Node> children
    ) {
    }

    public record Node(String key, String labelEn, String labelHi, String href, int order) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public List<Pillar> getPillars() { return pillars; }
    public void setPillars(List<Pillar> pillars) { this.pillars = pillars; }
}
