package co.thetapa.ritualcard;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Tracking record for one generated ritual-card PDF. One doc per article;
 * {@code variantHash} (sha256 of the CardModel JSON) decides whether the
 * stored PDF is still fresh.
 */
@Document("ritual_cards")
public class RitualCard {

    @Id
    private String id;

    @Indexed(unique = true)
    private String articleSlug;

    private String variantHash;
    private Instant generatedAt;
    private String pdfPath;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getArticleSlug() { return articleSlug; }
    public void setArticleSlug(String articleSlug) { this.articleSlug = articleSlug; }
    public String getVariantHash() { return variantHash; }
    public void setVariantHash(String variantHash) { this.variantHash = variantHash; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
    public String getPdfPath() { return pdfPath; }
    public void setPdfPath(String pdfPath) { this.pdfPath = pdfPath; }
}
