package co.thetapa.engagement;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("saved_rituals")
@CompoundIndex(name = "user_article", def = "{'userId': 1, 'articleSlug': 1}", unique = true)
public class SavedRitual {

    @Id
    private String id;

    private String userId;
    private String articleSlug;

    @CreatedDate
    private Instant savedAt;

    public SavedRitual() {
    }

    public SavedRitual(String userId, String articleSlug) {
        this.userId = userId;
        this.articleSlug = articleSlug;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getArticleSlug() { return articleSlug; }
    public void setArticleSlug(String articleSlug) { this.articleSlug = articleSlug; }
    public Instant getSavedAt() { return savedAt; }
    public void setSavedAt(Instant savedAt) { this.savedAt = savedAt; }
}
