package co.thetapa.adminsearch;

import co.thetapa.common.ApiResponse;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * One search box for the whole console.
 *
 * <p>Deliberately not the public Typesense index: that holds published content
 * only, and an editor's first need is to find the draft they were working on.
 * This reads the collections directly, so a document is findable the moment it
 * is saved.</p>
 *
 * <p>Case-insensitive substring, not full text — with a few thousand documents
 * that is fast enough, and it means a partial slug ("hartal") finds the thing,
 * which is how people actually search a CMS.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/search")
public class AdminSearchController {

    /** Per collection, so one busy type cannot crowd the others out. */
    private static final int PER_TYPE = 6;

    private final MongoTemplate mongo;

    public AdminSearchController(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    /**
     * @param type   what it is, for the group heading
     * @param title  the line an editor recognises
     * @param detail the second line — slug, date, status
     * @param href   where the console edits it
     */
    public record Hit(String type, String title, String detail, String href) {
    }

    @GetMapping
    public ApiResponse<List<Hit>> search(@RequestParam String q) {
        String term = q == null ? "" : q.trim();
        if (term.length() < 2) {
            return ApiResponse.ok(List.of());
        }
        Pattern p = Pattern.compile(Pattern.quote(term), Pattern.CASE_INSENSITIVE);
        List<Hit> hits = new ArrayList<>();

        collect(hits, "Article", "articles",
            new Criteria().orOperator(
                Criteria.where("slug").regex(p),
                Criteria.where("lang.en.title").regex(p),
                Criteria.where("lang.hi.title").regex(p)),
            d -> str(nested(d, "lang", "en", "title"), str(d.get("slug"), "—")),
            d -> str(d.get("slug"), "") + " · " + str(d.get("status"), ""),
            d -> "/articles/" + str(d.get("slug"), ""));

        collect(hits, "Product", "products",
            new Criteria().orOperator(
                Criteria.where("slug").regex(p),
                Criteria.where("title").regex(p)),
            d -> str(d.get("title"), "—"),
            d -> str(d.get("slug"), "") + " · " + str(d.get("availability"), ""),
            d -> "/products");

        collect(hits, "Observance", "observances",
            new Criteria().orOperator(
                Criteria.where("slug").regex(p),
                Criteria.where("name").regex(p),
                Criteria.where("nameHi").regex(p)),
            d -> str(d.get("name"), "—"),
            d -> str(d.get("slug"), "") + " · " + str(d.get("date"), ""),
            d -> "/observances");

        collect(hits, "Glossary", "glossary_terms",
            new Criteria().orOperator(
                Criteria.where("slug").regex(p),
                Criteria.where("term").regex(p)),
            d -> str(d.get("term"), "—"),
            d -> str(d.get("slug"), ""),
            d -> "/glossary");

        collect(hits, "Order", "orders",
            new Criteria().orOperator(
                Criteria.where("orderNumber").regex(p),
                Criteria.where("phone").regex(p)),
            d -> str(d.get("orderNumber"), "—"),
            d -> str(d.get("phone"), "") + " · " + str(d.get("status"), ""),
            d -> "/orders");

        collect(hits, "Purohit", "purohits",
            new Criteria().orOperator(
                Criteria.where("slug").regex(p),
                Criteria.where("name").regex(p),
                Criteria.where("phone").regex(p)),
            d -> str(d.get("name"), "—"),
            d -> str(d.get("slug"), ""),
            d -> "/purohits");

        return ApiResponse.ok(hits);
    }

    @SuppressWarnings("unchecked")
    private void collect(List<Hit> into, String type, String collection, Criteria criteria,
                         java.util.function.Function<Map<String, Object>, String> title,
                         java.util.function.Function<Map<String, Object>, String> detail,
                         java.util.function.Function<Map<String, Object>, String> href) {
        if (!mongo.collectionExists(collection)) {
            return;
        }
        List<Map> found = mongo.find(Query.query(criteria).limit(PER_TYPE), Map.class, collection);
        for (Map raw : found) {
            Map<String, Object> d = (Map<String, Object>) raw;
            into.add(new Hit(type, title.apply(d), detail.apply(d), href.apply(d)));
        }
    }

    private static Object nested(Map<String, Object> d, String... path) {
        Object cur = d;
        for (String key : path) {
            if (!(cur instanceof Map<?, ?> m)) {
                return null;
            }
            cur = m.get(key);
        }
        return cur;
    }

    private static String str(Object o, String fallback) {
        String s = o == null ? "" : String.valueOf(o);
        return s.isBlank() ? fallback : s;
    }
}
