package co.thetapa.booking;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Document("purohits")
public class Purohit {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String phone;            // E.164, internal only — never in public DTOs

    private double rating;           // e.g. 4.8
    private int pujaCount;           // "127 pujas"

    private List<String> languages;  // Hindi, Sanskrit, English…
    private List<String> pujaTypeSlugs;
    private List<String> cities;     // "delhi-ncr"

    private List<LocalDate> unavailableDates;
    /** slot keys this purohit does not serve (e.g. no evenings) */
    private List<String> unavailableSlots;

    private boolean verified;
    private boolean active = true;
    private String lineageNote;      // shown on the card ("Kashi-trained, 3rd generation")

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getPujaCount() { return pujaCount; }
    public void setPujaCount(int pujaCount) { this.pujaCount = pujaCount; }
    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) { this.languages = languages; }
    public List<String> getPujaTypeSlugs() { return pujaTypeSlugs; }
    public void setPujaTypeSlugs(List<String> pujaTypeSlugs) { this.pujaTypeSlugs = pujaTypeSlugs; }
    public List<String> getCities() { return cities; }
    public void setCities(List<String> cities) { this.cities = cities; }
    public List<LocalDate> getUnavailableDates() { return unavailableDates; }
    public void setUnavailableDates(List<LocalDate> unavailableDates) { this.unavailableDates = unavailableDates; }
    public List<String> getUnavailableSlots() { return unavailableSlots; }
    public void setUnavailableSlots(List<String> unavailableSlots) { this.unavailableSlots = unavailableSlots; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getLineageNote() { return lineageNote; }
    public void setLineageNote(String lineageNote) { this.lineageNote = lineageNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
