package co.thetapa.media;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * One uploaded binary (hero image, WA/OG variant, audio guide, PDF…).
 * The document holds metadata only; the bytes live behind {@link MediaStorage}
 * under {@code storageKey}. Articles reference assets by id (heroImageId,
 * waImageId, audioGuideMediaId, mantra audio ids) — this collection is the
 * single registry those ids resolve against.
 */
@Document("media_assets")
public class MediaAsset {

    @Id
    private String id;

    /** Original client filename, sanitized — display only, never used as a path. */
    private String filename;
    /** Normalized content type, e.g. image/jpeg, audio/mpeg. */
    private String mime;
    /** Stored size in bytes (after any recompression). */
    private long bytes;
    private MediaKind kind;
    /** Pixel dimensions; null for audio/PDF and for images we cannot decode (webp). */
    private Integer width;
    private Integer height;
    /** Location within the storage backend, e.g. {@code uploads/<id>.jpg}. */
    private String storageKey;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getMime() { return mime; }
    public void setMime(String mime) { this.mime = mime; }
    public long getBytes() { return bytes; }
    public void setBytes(long bytes) { this.bytes = bytes; }
    public MediaKind getKind() { return kind; }
    public void setKind(MediaKind kind) { this.kind = kind; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
