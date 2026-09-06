package co.thetapa.mandali;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * A bookable bhajan-mandali format (Sundarkand, Mata Ki Chowki, …). Unlike
 * pujas there is no instant price — startingPricePaise is a "from ₹" anchor;
 * the final quote is confirmed per request by the team.
 */
@Document("mandali_types")
public class MandaliType {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String nameHi;
    private String description;

    /** What the mandali brings — e.g. "5–7 member singing group". */
    private List<String> inclusions;

    /** "From ₹N" anchor; the confirmed quote may differ per date/venue. */
    private long startingPricePaise;

    /** e.g. "Navratri / all-year", "Overnight event — festival season". */
    private String seasonNote;

    private String hueClass;
    private boolean active = true;

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
    public String getNameHi() { return nameHi; }
    public void setNameHi(String nameHi) { this.nameHi = nameHi; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getInclusions() { return inclusions; }
    public void setInclusions(List<String> inclusions) { this.inclusions = inclusions; }
    public long getStartingPricePaise() { return startingPricePaise; }
    public void setStartingPricePaise(long startingPricePaise) { this.startingPricePaise = startingPricePaise; }
    public String getSeasonNote() { return seasonNote; }
    public void setSeasonNote(String seasonNote) { this.seasonNote = seasonNote; }
    public String getHueClass() { return hueClass; }
    public void setHueClass(String hueClass) { this.hueClass = hueClass; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
