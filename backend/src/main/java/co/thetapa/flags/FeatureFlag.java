package co.thetapa.flags;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * PRD non-negotiable: phase switches (kits_launched, purohit_tab_visible) are
 * data, not deploys. The marketing team flips these from the admin panel.
 */
@Document("feature_flags")
public class FeatureFlag {

    @Id
    private String id;

    @Indexed(unique = true)
    private String key;

    private boolean value;

    private String updatedBy;

    @LastModifiedDate
    private Instant updatedAt;

    public FeatureFlag() {
    }

    public FeatureFlag(String key, boolean value) {
        this.key = key;
        this.value = value;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public boolean isValue() { return value; }
    public void setValue(boolean value) { this.value = value; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
