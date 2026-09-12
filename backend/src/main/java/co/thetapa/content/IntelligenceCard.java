package co.thetapa.content;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * A rule that generalises past the article you happen to be reading —
 * "what counts as a grain on Ekadashi" is the same answer on all twenty-four
 * Ekadashi guides.
 *
 * Its own entity rather than a block, deliberately. The spec says the card is
 * "shared across all twenty-four Ekadashi guides and maintained in one place";
 * inline it and the copy is duplicated twenty-four times and drifts the first
 * time someone corrects one of them. Articles reference this by slug.
 */
@Document("intelligence_cards")
public class IntelligenceCard {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    /** Eyebrow, e.g. "What counts as a grain". */
    private String label;

    /** The claim itself, one line. */
    private String headline;

    /** The explanation. */
    private String body;

    /** Optional supporting points, e.g. "Kuttu is a seed". */
    private List<String> points;

    /** Where "Read more" goes — usually a dharmic concept slug. */
    private String readMoreSlug;
    private String readMoreLabel;

    /** Classification, when the card makes a ritual-authority claim. */
    private Dpb dpb;

    private boolean published;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public List<String> getPoints() { return points; }
    public void setPoints(List<String> points) { this.points = points; }
    public String getReadMoreSlug() { return readMoreSlug; }
    public void setReadMoreSlug(String readMoreSlug) { this.readMoreSlug = readMoreSlug; }
    public String getReadMoreLabel() { return readMoreLabel; }
    public void setReadMoreLabel(String readMoreLabel) { this.readMoreLabel = readMoreLabel; }
    public Dpb getDpb() { return dpb; }
    public void setDpb(Dpb dpb) { this.dpb = dpb; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
