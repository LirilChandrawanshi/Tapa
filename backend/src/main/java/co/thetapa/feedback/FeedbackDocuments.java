package co.thetapa.feedback;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

public final class FeedbackDocuments {

    private FeedbackDocuments() {
    }

    /** "Notify me" capture for pre-launch surfaces (kits, purohit). */
    @Document("notify_requests")
    @CompoundIndex(name = "context_phone", def = "{'context': 1, 'phone': 1}", unique = true)
    public static class NotifyRequest {

        @Id
        public String id;
        public String context;      // kits | purohit
        public String phone;
        public String articleSlug;
        @CreatedDate
        public Instant createdAt;
    }

    /** Report-a-correction form submissions (reviewed by the RI team). */
    @Document("correction_reports")
    public static class CorrectionReport {

        @Id
        public String id;
        public String pageUrl;
        public String lineAsItStands;
        public String whatItShouldSay;
        public String source;        // text + chapter/verse
        public boolean isPratha;
        public String name;
        public String email;
        public String whatsapp;
        public String status = "new";   // new | triaged | fixed | rejected
        @CreatedDate
        public Instant createdAt;
    }

    /** Work-with-us applications: team / purohit / retailer. */
    @Document("applications")
    public static class Application {

        @Id
        public String id;
        public String type;          // team | purohit | retailer
        public Map<String, Object> fields;
        public String status = "new";
        @CreatedDate
        public Instant createdAt;
    }
}
