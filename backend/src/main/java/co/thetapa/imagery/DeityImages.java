package co.thetapa.imagery;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * The image set a deity lends to every observance that names it.
 *
 * <p>A set rather than a single image, because one deity carries many dates —
 * six Ekadashis all name Vishnu — and six identical cards on one shelf read as
 * a bug. Which image an observance takes is decided by
 * {@link DeityImageService#imageFor}, not stored, so the mapping stays this
 * short: roughly fifteen rows cover a whole year, and next year's observances
 * inherit their artwork the day they are entered.</p>
 */
@Document("deity_images")
public class DeityImages {

    @Id
    private String id;

    /** Lower-cased deity name — the join key with {@code Observance.deity}. */
    @Indexed(unique = true)
    private String deity;

    /** Media asset ids, in the order an editor arranged them. */
    private List<String> imageIds = List.of();

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDeity() { return deity; }
    public void setDeity(String deity) { this.deity = deity; }
    public List<String> getImageIds() { return imageIds; }
    public void setImageIds(List<String> imageIds) {
        this.imageIds = imageIds == null ? List.of() : imageIds;
    }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
