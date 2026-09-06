package co.thetapa.content;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Document("articles")
@CompoundIndex(name = "status_category", def = "{'status': 1, 'category': 1}")
@CompoundIndex(name = "featured", def = "{'isFeatured': 1, 'status': 1}")
public class Article {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private ArticleType type;
    private ArticleStatus status = ArticleStatus.DRAFT;

    /** category/sub-category slugs from the taxonomy, e.g. "ritual-guides" / "festive-pujans" */
    private String category;
    private String subCategory;

    /** localized content keyed by language ("en", "hi"); en is required, hi optional */
    private Map<String, ArticleContent> lang;

    /** article-level classification; per-step tags live inside vidhi blocks */
    private Dpb dpb;

    private String heroImageId;
    /** 800×418 WhatsApp/OG variant */
    private String waImageId;
    /** deity gradient key from the design system, e.g. "h-shiva" */
    private String hueClass;

    private Integer readMinutes;

    /** the date this observance falls on (seasonal articles); drives countdowns + sorting */
    @Indexed
    private LocalDate observanceDate;
    @Indexed
    private String linkedObservanceSlug;

    /* dormant Phase-2+ hooks — kept from day one so later phases are additive */
    private String circleTeaser;      // <=100 chars, WhatsApp T2 reminder body
    private String kitLinkedSlug;
    private Integer reminderDaysBefore = 1;
    private Boolean isFestival = false;

    private Boolean isFeatured = false;
    private Integer heroOrder;
    private List<String> relatedSlugs;

    private Instant publishedAt;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record ArticleContent(
        String title,
        String heroSubtitle,   // max 120 chars
        String deck,
        String introHtml,
        List<Block> blocks,
        String audioGuideMediaId
    ) {
    }

    // getters/setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public ArticleType getType() { return type; }
    public void setType(ArticleType type) { this.type = type; }
    public ArticleStatus getStatus() { return status; }
    public void setStatus(ArticleStatus status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }
    public Map<String, ArticleContent> getLang() { return lang; }
    public void setLang(Map<String, ArticleContent> lang) { this.lang = lang; }
    public Dpb getDpb() { return dpb; }
    public void setDpb(Dpb dpb) { this.dpb = dpb; }
    public String getHeroImageId() { return heroImageId; }
    public void setHeroImageId(String heroImageId) { this.heroImageId = heroImageId; }
    public String getWaImageId() { return waImageId; }
    public void setWaImageId(String waImageId) { this.waImageId = waImageId; }
    public String getHueClass() { return hueClass; }
    public void setHueClass(String hueClass) { this.hueClass = hueClass; }
    public Integer getReadMinutes() { return readMinutes; }
    public void setReadMinutes(Integer readMinutes) { this.readMinutes = readMinutes; }
    public LocalDate getObservanceDate() { return observanceDate; }
    public void setObservanceDate(LocalDate observanceDate) { this.observanceDate = observanceDate; }
    public String getLinkedObservanceSlug() { return linkedObservanceSlug; }
    public void setLinkedObservanceSlug(String linkedObservanceSlug) { this.linkedObservanceSlug = linkedObservanceSlug; }
    public String getCircleTeaser() { return circleTeaser; }
    public void setCircleTeaser(String circleTeaser) { this.circleTeaser = circleTeaser; }
    public String getKitLinkedSlug() { return kitLinkedSlug; }
    public void setKitLinkedSlug(String kitLinkedSlug) { this.kitLinkedSlug = kitLinkedSlug; }
    public Integer getReminderDaysBefore() { return reminderDaysBefore; }
    public void setReminderDaysBefore(Integer reminderDaysBefore) { this.reminderDaysBefore = reminderDaysBefore; }
    public Boolean getIsFestival() { return isFestival; }
    public void setIsFestival(Boolean isFestival) { this.isFestival = isFestival; }
    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }
    public Integer getHeroOrder() { return heroOrder; }
    public void setHeroOrder(Integer heroOrder) { this.heroOrder = heroOrder; }
    public List<String> getRelatedSlugs() { return relatedSlugs; }
    public void setRelatedSlugs(List<String> relatedSlugs) { this.relatedSlugs = relatedSlugs; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
