package co.thetapa.feed;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * One admin-curated homepage feed card. Either references an existing
 * entity by id+type (PRODUCT/ARTICLE/OBSERVANCE/GLOSSARY_TERM) or is a
 * standalone LINK/PROMO with its own copy.
 */
@Document("feed_items")
public class FeedItem {

    public enum RefType { PRODUCT, ARTICLE, OBSERVANCE, GLOSSARY_TERM, LINK, PROMO }

    /** Controls how large the card renders on the homepage. */
    public enum Layout { HERO, WIDE, STANDARD }

    @Id
    private String id;

    @Indexed
    private RefType refType;

    /** Product/Article/Observance/GlossaryTerm id. Null for LINK/PROMO. */
    private String refId;

    /** Populated only when refType == LINK. */
    private String externalUrl;

    /** Required only when refType == LINK (nothing else to source a title from). */
    private String linkTitle;

    /** PROMO-only: the big headline text (falls back to caption if blank). */
    private String headline;

    /** PROMO-only: small eyebrow above the headline, e.g. "LIMITED TIME". */
    private String badge;

    /** PROMO-only: button text, e.g. "Pre-book now". */
    private String ctaLabel;

    /** PROMO-only: where the CTA button links. */
    private String ctaHref;

    /** Optional editorial blurb shown on the card regardless of refType. */
    private String caption;

    /** Optional image override (media asset id). Falls back to the referenced
     *  entity's own image when null, for PRODUCT/ARTICLE/OBSERVANCE. */
    private String imageId;

    /** Optional gradient-art override, e.g. "h-vishnu". Falls back to a
     *  sensible per-entity default when null — cards never render bare. */
    private String hueClass;

    /** How large the card renders — HERO spans full-bleed, WIDE is a large
     *  rail card, STANDARD is the compact rail size. Null = STANDARD. */
    private Layout layout;

    /** Manual admin ordering — lower shows first. Not a timestamp. */
    @Indexed
    private int order;

    private boolean published;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public RefType getRefType() { return refType; }
    public void setRefType(RefType refType) { this.refType = refType; }

    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }

    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

    public String getLinkTitle() { return linkTitle; }
    public void setLinkTitle(String linkTitle) { this.linkTitle = linkTitle; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getCtaLabel() { return ctaLabel; }
    public void setCtaLabel(String ctaLabel) { this.ctaLabel = ctaLabel; }

    public String getCtaHref() { return ctaHref; }
    public void setCtaHref(String ctaHref) { this.ctaHref = ctaHref; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getHueClass() { return hueClass; }
    public void setHueClass(String hueClass) { this.hueClass = hueClass; }

    public Layout getLayout() { return layout; }
    public void setLayout(Layout layout) { this.layout = layout; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
