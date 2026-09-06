package co.thetapa.identity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document("users")
public class User {

    @Id
    private String id;

    /** E.164, e.g. +919876543210 — the identity key across the platform */
    @Indexed(unique = true)
    private String phone;

    private String name;
    private String languagePref = "en";
    private String city = "Delhi-NCR";

    private List<String> roles = new ArrayList<>(List.of("USER"));

    /** sha256 hashes of active refresh tokens */
    private List<String> refreshTokens = new ArrayList<>();

    /** notification prefs grouped by purpose; order/delivery is always-on later */
    private Map<String, Boolean> notificationPrefs;

    private Instant lastActiveAt;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLanguagePref() { return languagePref; }
    public void setLanguagePref(String languagePref) { this.languagePref = languagePref; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public List<String> getRefreshTokens() { return refreshTokens; }
    public void setRefreshTokens(List<String> refreshTokens) { this.refreshTokens = refreshTokens; }
    public Map<String, Boolean> getNotificationPrefs() { return notificationPrefs; }
    public void setNotificationPrefs(Map<String, Boolean> notificationPrefs) { this.notificationPrefs = notificationPrefs; }
    public Instant getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
