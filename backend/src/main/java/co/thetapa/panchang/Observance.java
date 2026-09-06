package co.thetapa.panchang;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A vrat, festival, eclipse or seasonal observance on the calendar.
 * The type legend is the PLP spec's four badges plus ECLIPSE.
 */
@Document("observances")
public class Observance {

    public enum Type { VRAT, FESTIVAL, SPECIAL_SEASONAL, PURNIMA_AMAVASYA, ECLIPSE }

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String name;
    private String nameHi;

    @Indexed
    private Type type;

    /** filter chips on the vrat calendar: ekadashi, pradosh, sawan-somwar, teej, purnima, amavasya, eclipse */
    private String series;
    /** position within a series, e.g. "1 of 4" for Sawan Somwar */
    private String seriesPosition;

    @Indexed
    private LocalDate date;
    /** Amanta-convention date when it differs from the (default) Purnimanta date */
    private LocalDate dateAmanta;
    /** multi-day festivals: last day inclusive */
    private LocalDate endDate;

    /** e.g. "Shravana Krishna Chaturdashi" */
    private String tithiLabel;
    private String deity;
    private String seasonBlock;   // e.g. "Sawan", "Chaturmas", "Pitru Paksha"

    /** tithi window — feeds the WhatsApp T2 reminder vars {{3}}/{{4}} later */
    private String tithiStartsAt; // ISO datetime string
    private String tithiEndsAt;

    private String blurb;
    private String circleTeaser;  // <=100 chars
    private String articleSlug;   // linked ritual guide
    private String heroImageId;

    private List<String> notes;   // e.g. "Not visible in India" for eclipses

    private boolean verified;

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
    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }
    public String getSeries() { return series; }
    public void setSeries(String series) { this.series = series; }
    public String getSeriesPosition() { return seriesPosition; }
    public void setSeriesPosition(String seriesPosition) { this.seriesPosition = seriesPosition; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalDate getDateAmanta() { return dateAmanta; }
    public void setDateAmanta(LocalDate dateAmanta) { this.dateAmanta = dateAmanta; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getTithiLabel() { return tithiLabel; }
    public void setTithiLabel(String tithiLabel) { this.tithiLabel = tithiLabel; }
    public String getDeity() { return deity; }
    public void setDeity(String deity) { this.deity = deity; }
    public String getSeasonBlock() { return seasonBlock; }
    public void setSeasonBlock(String seasonBlock) { this.seasonBlock = seasonBlock; }
    public String getTithiStartsAt() { return tithiStartsAt; }
    public void setTithiStartsAt(String tithiStartsAt) { this.tithiStartsAt = tithiStartsAt; }
    public String getTithiEndsAt() { return tithiEndsAt; }
    public void setTithiEndsAt(String tithiEndsAt) { this.tithiEndsAt = tithiEndsAt; }
    public String getBlurb() { return blurb; }
    public void setBlurb(String blurb) { this.blurb = blurb; }
    public String getCircleTeaser() { return circleTeaser; }
    public void setCircleTeaser(String circleTeaser) { this.circleTeaser = circleTeaser; }
    public String getArticleSlug() { return articleSlug; }
    public void setArticleSlug(String articleSlug) { this.articleSlug = articleSlug; }
    public String getHeroImageId() { return heroImageId; }
    public void setHeroImageId(String heroImageId) { this.heroImageId = heroImageId; }
    public List<String> getNotes() { return notes; }
    public void setNotes(List<String> notes) { this.notes = notes; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
