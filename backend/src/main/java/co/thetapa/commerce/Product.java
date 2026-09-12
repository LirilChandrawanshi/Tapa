package co.thetapa.commerce;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A Ritual Pujan (kit) SKU. Money is always integer paise — never floats.
 * Naming per the locked micro-copy: heading "[Festival] Ritual Kit",
 * contents heading "What's in this kit".
 */
@Document("products")
public class Product {

    public enum Availability { PREBOOK, LIVE, COMING_SOON, SOLD_OUT }

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    /** by-festival | by-ritual | griha-life-events | daily-puja-essentials */
    @Indexed
    private String category;

    private String title;             // "Shakti Ritual Kit"
    private String titleDevanagari;   // "शक्ति"
    private String eyebrow;           // "NAVRATRI PUJAN · SEASON 1"
    private String season;
    private String description;

    private long pricePaise;
    private Long mrpPaise;            // struck-through when higher than price
    private boolean taxInclusive = true;

    private String hueClass;
    private List<String> imageIds;

    private List<Item> items;         // the "What's in this kit" manifest

    private Availability availability = Availability.COMING_SOON;
    /** last date a dated (pre-book) kit can be ordered */
    private LocalDate orderByDate;
    private LocalDate dispatchFrom;
    /** the occasion this kit serves; dated kits deliver 3 days before it */
    private LocalDate festivalDate;
    private Integer stock;            // null = untracked

    private List<String> linkedGuideSlugs;
    private String linkedObservanceSlug;

    /** editorial block: why this kit, what it is not (anti-upsell honesty) */
    private String significanceHtml;
    private String howToUseNote;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Item(int n, String name, int qty, String note) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTitleDevanagari() { return titleDevanagari; }
    public void setTitleDevanagari(String titleDevanagari) { this.titleDevanagari = titleDevanagari; }
    public String getEyebrow() { return eyebrow; }
    public void setEyebrow(String eyebrow) { this.eyebrow = eyebrow; }
    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public long getPricePaise() { return pricePaise; }
    public void setPricePaise(long pricePaise) { this.pricePaise = pricePaise; }
    public Long getMrpPaise() { return mrpPaise; }
    public void setMrpPaise(Long mrpPaise) { this.mrpPaise = mrpPaise; }
    public boolean isTaxInclusive() { return taxInclusive; }
    public void setTaxInclusive(boolean taxInclusive) { this.taxInclusive = taxInclusive; }
    public String getHueClass() { return hueClass; }
    public void setHueClass(String hueClass) { this.hueClass = hueClass; }
    public List<String> getImageIds() { return imageIds; }
    public void setImageIds(List<String> imageIds) { this.imageIds = imageIds; }
    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }
    public Availability getAvailability() { return availability; }
    public void setAvailability(Availability availability) { this.availability = availability; }
    public LocalDate getOrderByDate() { return orderByDate; }
    public void setOrderByDate(LocalDate orderByDate) { this.orderByDate = orderByDate; }
    public LocalDate getDispatchFrom() { return dispatchFrom; }
    public void setDispatchFrom(LocalDate dispatchFrom) { this.dispatchFrom = dispatchFrom; }
    public LocalDate getFestivalDate() { return festivalDate; }
    public void setFestivalDate(LocalDate festivalDate) { this.festivalDate = festivalDate; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    /** Locked policy: 72 hours free cancellation on a pre-booked kit, 24 on an in-stock one. */
    public int getCancellationHours() { return availability == Availability.PREBOOK ? 72 : 24; }
    public List<String> getLinkedGuideSlugs() { return linkedGuideSlugs; }
    public void setLinkedGuideSlugs(List<String> linkedGuideSlugs) { this.linkedGuideSlugs = linkedGuideSlugs; }
    public String getLinkedObservanceSlug() { return linkedObservanceSlug; }
    public void setLinkedObservanceSlug(String linkedObservanceSlug) { this.linkedObservanceSlug = linkedObservanceSlug; }
    public String getSignificanceHtml() { return significanceHtml; }
    public void setSignificanceHtml(String significanceHtml) { this.significanceHtml = significanceHtml; }
    public String getHowToUseNote() { return howToUseNote; }
    public void setHowToUseNote(String howToUseNote) { this.howToUseNote = howToUseNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
