package co.thetapa.homesections;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * An editor-placed band on the homepage — a banner, an offer, or a push for
 * one product. Unlike {@link HomeSection}, which is fixed copy for a band the
 * page already has, promos are created and removed freely and choose their own
 * slot on the page.
 *
 * <p>Two things keep a promo from going stale. It carries an optional live
 * window, so an offer stops showing itself the moment it ends rather than
 * waiting for someone to remember it. And when {@code productSlug} is set the
 * title, price and link are read from the product at request time, so a price
 * change in Products cannot leave a wrong number on the homepage.</p>
 */
@Document("home_promos")
public class HomePromo {

    /** Where on the page the band sits. */
    public enum Placement { AFTER_HERO, AFTER_CALENDAR, BEFORE_CIRCLE, PAGE_END }

    /** Loud brand-pink band, or a quiet bordered card. */
    public enum Style { BOLD, SUBTLE }

    @Id
    private String id;

    private String eyebrow;
    private String title;
    private String body;
    /** Small pill — "Limited", "20% off", "Ends Sunday". */
    private String badge;

    private String ctaLabel;
    private String ctaHref;

    /** Optional. When set, price and link come from the product itself. */
    private String productSlug;

    private Placement placement = Placement.AFTER_CALENDAR;
    private Style style = Style.SUBTLE;

    /** Lower first, among promos sharing a placement. */
    private int order;

    private boolean published = false;

    /** Optional live window. Null means "no bound on this end". */
    private Instant startsAt;
    private Instant endsAt;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    /** True when this promo should be on the page at {@code now}. */
    public boolean isLiveAt(Instant now) {
        if (!published) {
            return false;
        }
        if (startsAt != null && now.isBefore(startsAt)) {
            return false;
        }
        return endsAt == null || !now.isAfter(endsAt);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEyebrow() { return eyebrow; }
    public void setEyebrow(String eyebrow) { this.eyebrow = eyebrow; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
    public String getCtaLabel() { return ctaLabel; }
    public void setCtaLabel(String ctaLabel) { this.ctaLabel = ctaLabel; }
    public String getCtaHref() { return ctaHref; }
    public void setCtaHref(String ctaHref) { this.ctaHref = ctaHref; }
    public String getProductSlug() { return productSlug; }
    public void setProductSlug(String productSlug) { this.productSlug = productSlug; }
    public Placement getPlacement() { return placement; }
    public void setPlacement(Placement placement) {
        this.placement = placement == null ? Placement.AFTER_CALENDAR : placement;
    }
    public Style getStyle() { return style; }
    public void setStyle(Style style) { this.style = style == null ? Style.SUBTLE : style; }
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
