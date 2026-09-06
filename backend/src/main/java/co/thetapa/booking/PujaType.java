package co.thetapa.booking;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * A bookable puja. Variants carry the price (paise); allowed time slots are
 * backend-enforced — some pujas (Rudrabhishek, Ghatasthapna) can only be
 * performed in specific windows, so the slot list is data, not UI convention.
 */
@Document("puja_types")
public class PujaType {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String nameHi;
    private String description;
    /** what the purohit actually does — the vidhi overview shown on the detail page */
    private String vidhiOverview;
    private List<String> vidhiPreviewSteps;
    private String hueClass;

    private List<Variant> variants;

    /** slot keys this puja may be booked in; empty = all slots */
    private List<String> allowedSlots;

    /** samagri kit bundled by default; the toggle can remove it */
    private boolean kitIncludedDefault = true;
    private String kitNote;

    private boolean annual;          // e.g. Navratri Ghatsthapna
    private String seasonNote;

    private String linkedGuideSlug;
    private boolean active = true;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Variant(String key, String name, String duration, String scope, long pricePaise) {
    }

    /** The canonical slot windows (Delhi-NCR practice). */
    public static final List<Slot> SLOTS = List.of(
        new Slot("early-morning", "Early morning", "6–9 am"),
        new Slot("morning", "Morning", "9 am–12 pm"),
        new Slot("afternoon", "Afternoon", "12–4 pm"),
        new Slot("evening", "Evening", "4–7 pm")
    );

    public record Slot(String key, String label, String window) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNameHi() { return nameHi; }
    public void setNameHi(String nameHi) { this.nameHi = nameHi; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getVidhiOverview() { return vidhiOverview; }
    public void setVidhiOverview(String vidhiOverview) { this.vidhiOverview = vidhiOverview; }
    public List<String> getVidhiPreviewSteps() { return vidhiPreviewSteps; }
    public void setVidhiPreviewSteps(List<String> vidhiPreviewSteps) { this.vidhiPreviewSteps = vidhiPreviewSteps; }
    public String getHueClass() { return hueClass; }
    public void setHueClass(String hueClass) { this.hueClass = hueClass; }
    public List<Variant> getVariants() { return variants; }
    public void setVariants(List<Variant> variants) { this.variants = variants; }
    public List<String> getAllowedSlots() { return allowedSlots; }
    public void setAllowedSlots(List<String> allowedSlots) { this.allowedSlots = allowedSlots; }
    public boolean isKitIncludedDefault() { return kitIncludedDefault; }
    public void setKitIncludedDefault(boolean kitIncludedDefault) { this.kitIncludedDefault = kitIncludedDefault; }
    public String getKitNote() { return kitNote; }
    public void setKitNote(String kitNote) { this.kitNote = kitNote; }
    public boolean isAnnual() { return annual; }
    public void setAnnual(boolean annual) { this.annual = annual; }
    public String getSeasonNote() { return seasonNote; }
    public void setSeasonNote(String seasonNote) { this.seasonNote = seasonNote; }
    public String getLinkedGuideSlug() { return linkedGuideSlug; }
    public void setLinkedGuideSlug(String linkedGuideSlug) { this.linkedGuideSlug = linkedGuideSlug; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
