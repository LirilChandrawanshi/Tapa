package co.thetapa.panchang;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * One day of panchang data for one city. Values are entered/imported and
 * editorially verified (the PRD's manual-first architecture); unverified days
 * serve with a provisional flag. Timing content carries no DPB tag by design.
 */
@Document("panchang_days")
@CompoundIndex(name = "date_city", def = "{'date': 1, 'city': 1}", unique = true)
public class PanchangDay {

    public static final String DEFAULT_CITY = "delhi-ncr";

    @Id
    private String id;

    private LocalDate date;
    private String city = DEFAULT_CITY;

    private Window tithi;        // e.g. "Saptami", with start/end
    private String paksha;       // "Shukla" | "Krishna"
    private String lunarMonth;   // e.g. "Shravana" (Purnimanta)
    private Window nakshatra;
    private String yoga;
    private String karana;

    private String sunrise;      // "05:24" local time
    private String sunset;
    private String moonrise;
    private String moonset;

    private TimeRange rahuKaal;
    private TimeRange abhijitMuhurat;
    private List<Muhurat> muhurats;

    private boolean verified;
    private String source = "Drik Panchang";

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Window(String name, String endsAt) {
    }

    public record TimeRange(String from, String to) {
    }

    public record Muhurat(String label, String from, String to, String kind) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Window getTithi() { return tithi; }
    public void setTithi(Window tithi) { this.tithi = tithi; }
    public String getPaksha() { return paksha; }
    public void setPaksha(String paksha) { this.paksha = paksha; }
    public String getLunarMonth() { return lunarMonth; }
    public void setLunarMonth(String lunarMonth) { this.lunarMonth = lunarMonth; }
    public Window getNakshatra() { return nakshatra; }
    public void setNakshatra(Window nakshatra) { this.nakshatra = nakshatra; }
    public String getYoga() { return yoga; }
    public void setYoga(String yoga) { this.yoga = yoga; }
    public String getKarana() { return karana; }
    public void setKarana(String karana) { this.karana = karana; }
    public String getSunrise() { return sunrise; }
    public void setSunrise(String sunrise) { this.sunrise = sunrise; }
    public String getSunset() { return sunset; }
    public void setSunset(String sunset) { this.sunset = sunset; }
    public String getMoonrise() { return moonrise; }
    public void setMoonrise(String moonrise) { this.moonrise = moonrise; }
    public String getMoonset() { return moonset; }
    public void setMoonset(String moonset) { this.moonset = moonset; }
    public TimeRange getRahuKaal() { return rahuKaal; }
    public void setRahuKaal(TimeRange rahuKaal) { this.rahuKaal = rahuKaal; }
    public TimeRange getAbhijitMuhurat() { return abhijitMuhurat; }
    public void setAbhijitMuhurat(TimeRange abhijitMuhurat) { this.abhijitMuhurat = abhijitMuhurat; }
    public List<Muhurat> getMuhurats() { return muhurats; }
    public void setMuhurats(List<Muhurat> muhurats) { this.muhurats = muhurats; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
