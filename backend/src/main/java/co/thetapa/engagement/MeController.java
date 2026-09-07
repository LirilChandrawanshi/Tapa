package co.thetapa.engagement;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final UserRepository users;
    private final SavedRitualRepository saved;
    private final ArticleRepository articles;
    private final co.thetapa.circle.CircleService circle;

    public MeController(UserRepository users, SavedRitualRepository saved,
                        ArticleRepository articles, co.thetapa.circle.CircleService circle) {
        this.users = users;
        this.saved = saved;
        this.articles = articles;
        this.circle = circle;
    }

    /** Tapa Circle membership for the account's phone (the Circle itself stays account-less). */
    @GetMapping("/circle")
    public ApiResponse<Map<String, Object>> circleStatus(@AuthenticationPrincipal String userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
        return ApiResponse.ok(Map.of("status", circle.status(user.getPhone()).name()));
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal String userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
        return ApiResponse.ok(Map.of(
            "phone", user.getPhone(),
            "name", Optional.ofNullable(user.getName()).orElse(""),
            "languagePref", user.getLanguagePref(),
            "city", user.getCity(),
            "savedCount", saved.countByUserId(userId)
        ));
    }

    public record ProfileUpdate(String name, String languagePref, String city) {
    }

    @PutMapping
    public ApiResponse<Map<String, Object>> update(@AuthenticationPrincipal String userId,
                                                   @RequestBody ProfileUpdate body) {
        User user = users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
        if (body.name() != null && !body.name().isBlank()) {
            user.setName(body.name().trim());
        }
        if (body.languagePref() != null && ("en".equals(body.languagePref()) || "hi".equals(body.languagePref()))) {
            user.setLanguagePref(body.languagePref());
        }
        if (body.city() != null && !body.city().isBlank()) {
            user.setCity(body.city().trim());
        }
        users.save(user);
        return ApiResponse.ok(Map.of("updated", true));
    }

    /**
     * Saved rituals in three tiers: upcoming dated (soonest first), then
     * undated evergreen guides (most recently saved first), then past dated
     * ones last (the UI dims them with a "returns next year" badge).
     */
    @GetMapping("/saved")
    public ApiResponse<?> savedRituals(@AuthenticationPrincipal String userId) {
        LocalDate today = LocalDate.now(co.thetapa.panchang.PanchangService.IST);
        var items = saved.findByUserId(userId).stream()
            .map(s -> {
                Optional<Article> article = articles.findBySlug(s.getArticleSlug());
                return Map.<String, Object>of(
                    "articleSlug", s.getArticleSlug(),
                    "savedAt", s.getSavedAt(),
                    "title", article.map(a -> a.getLang().get("en").title()).orElse(s.getArticleSlug()),
                    "category", article.map(Article::getCategory).orElse(""),
                    "observanceDate", article.map(Article::getObservanceDate).map(Object::toString).orElse(""),
                    "past", article.map(Article::getObservanceDate).map(d -> d.isBefore(today)).orElse(false)
                );
            })
            .sorted(Comparator
                .comparingInt((Map<String, Object> m) -> {
                    String d = (String) m.get("observanceDate");
                    if (d.isEmpty()) return 1;                             // undated in the middle
                    return LocalDate.parse(d).isBefore(today) ? 2 : 0;     // past sinks, upcoming leads
                })
                .thenComparing(m -> {
                    String d = (String) m.get("observanceDate");
                    // upcoming: soonest first; past: keep date order too
                    return d.isEmpty() ? "" : d;
                })
                .thenComparing(m -> (java.time.Instant) m.get("savedAt"),
                    Comparator.nullsLast(Comparator.reverseOrder())))       // undated: recently saved first
            .toList();
        return ApiResponse.ok(items);
    }

    @PostMapping("/saved/{articleSlug}")
    public ApiResponse<Map<String, Object>> save(@AuthenticationPrincipal String userId,
                                                 @PathVariable String articleSlug) {
        articles.findBySlug(articleSlug)
            .orElseThrow(() -> new NotFoundException("article", articleSlug));
        try {
            saved.save(new SavedRitual(userId, articleSlug));
        } catch (DuplicateKeyException ignored) {
            // already saved — idempotent
        }
        return ApiResponse.ok(Map.of("saved", true));
    }

    @DeleteMapping("/saved/{articleSlug}")
    public ApiResponse<Map<String, Object>> unsave(@AuthenticationPrincipal String userId,
                                                   @PathVariable String articleSlug) {
        saved.findByUserIdAndArticleSlug(userId, articleSlug).ifPresent(saved::delete);
        return ApiResponse.ok(Map.of("saved", false));
    }
}
