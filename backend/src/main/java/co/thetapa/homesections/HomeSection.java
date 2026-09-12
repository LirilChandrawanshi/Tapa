package co.thetapa.homesections;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Editable copy for a homepage band that carries no other data source.
 *
 * <p>The data-backed sections (hero, panchang, calendar shelf, kits, guides
 * rail) already come from their own collections. These are the bands whose
 * words were literals in the JSX — the launch bar, the concept spotlight, the
 * beginner's rail, the method band, the Circle band and the purohit strip.</p>
 *
 * <p>Shape is deliberately loose: {@code fields} for the flat copy slots and
 * {@code items} for the repeatable rows. Layout, colour tokens and DPB badge
 * styling stay in the components — those are locked by the PRD and are not an
 * editor's to change. {@link HomeSectionSeed} writes today's live copy in on
 * first boot, so turning this on changes nothing on the page.</p>
 */
@Document("home_sections")
public class HomeSection {

    @Id
    private String id;

    /** Stable identifier the component looks itself up by, e.g. "launch-bar". */
    @Indexed(unique = true)
    private String key;

    /** Human name for the CMS list. */
    private String label;

    /** Unpublishing hides the band on the homepage — no deploy needed. */
    private boolean published = true;

    /** Flat copy slots: title, body, ctaLabel… */
    private Map<String, String> fields = new LinkedHashMap<>();

    /** Repeatable rows: the rail's three steps, the method band's three tags. */
    private List<Map<String, String>> items = List.of();

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Map<String, String> getFields() { return fields; }
    public void setFields(Map<String, String> fields) {
        this.fields = fields == null ? new LinkedHashMap<>() : fields;
    }
    public List<Map<String, String>> getItems() { return items; }
    public void setItems(List<Map<String, String>> items) {
        this.items = items == null ? List.of() : items;
    }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
