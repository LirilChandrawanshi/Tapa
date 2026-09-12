package co.thetapa.homesections;

import co.thetapa.commerce.Product;
import co.thetapa.commerce.ProductRepository;
import co.thetapa.common.NotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** CRUD for the editor-placed homepage bands, plus the live view the page reads. */
@Service
public class HomePromoService {

    private final HomePromoRepository repository;
    private final ProductRepository products;
    private final ApplicationEventPublisher events;

    public HomePromoService(HomePromoRepository repository, ProductRepository products,
                            ApplicationEventPublisher events) {
        this.repository = repository;
        this.products = products;
        this.events = events;
    }

    public record HomePromoChangedEvent(String id) {
    }

    /** Admin list — everything, including scheduled and unpublished. */
    public List<HomePromo> all() {
        return repository.findAllByOrderByPlacementAscOrderAsc();
    }

    /**
     * The promos that belong on the page right now, flattened for the client
     * and grouped by placement.
     *
     * <p>Not cached: a promo's live window turns it on and off by the clock, and
     * a cached copy would keep showing an expired offer. The read is one small
     * collection scan, and the composed /home payload above it is already
     * cached for five minutes — that is the right place for the caching.</p>
     */
    public Map<String, List<Map<String, Object>>> liveByPlacement() {
        Instant now = Instant.now();
        Map<String, List<Map<String, Object>>> out = new LinkedHashMap<>();
        for (HomePromo p : all()) {
            if (!p.isLiveAt(now)) {
                continue;
            }
            out.computeIfAbsent(p.getPlacement().name(), k -> new ArrayList<>()).add(view(p));
        }
        return out;
    }

    /**
     * Client shape. A linked product supplies the price and the link, so those
     * can never drift from what Products says.
     */
    private Map<String, Object> view(HomePromo p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("eyebrow", p.getEyebrow());
        m.put("title", p.getTitle());
        m.put("body", p.getBody());
        m.put("badge", p.getBadge());
        m.put("style", p.getStyle().name());
        m.put("placement", p.getPlacement().name());

        String href = p.getCtaHref();
        String label = p.getCtaLabel();
        if (p.getProductSlug() != null && !p.getProductSlug().isBlank()) {
            Product product = products.findBySlug(p.getProductSlug()).orElse(null);
            if (product != null) {
                m.put("productTitle", product.getTitle());
                m.put("productPricePaise", product.getPricePaise());
                m.put("productMrpPaise", product.getMrpPaise());
                m.put("productAvailability", product.getAvailability().name());
                m.put("productHueClass", product.getHueClass());
                if (href == null || href.isBlank()) {
                    href = "/ritual-pujans/p/" + product.getSlug();
                }
                if (label == null || label.isBlank()) {
                    label = "View the kit ›";
                }
            }
            // A slug that no longer resolves leaves the promo as plain copy
            // rather than linking into a 404.
        }
        m.put("ctaHref", href);
        m.put("ctaLabel", label);
        return m;
    }

    @CacheEvict(value = "home", allEntries = true)
    public HomePromo create(HomePromo body) {
        body.setId(null);
        HomePromo saved = repository.save(body);
        events.publishEvent(new HomePromoChangedEvent(saved.getId()));
        return saved;
    }

    @CacheEvict(value = "home", allEntries = true)
    public HomePromo update(String id, HomePromo body) {
        HomePromo existing = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("home promo", id));
        existing.setEyebrow(body.getEyebrow());
        existing.setTitle(body.getTitle());
        existing.setBody(body.getBody());
        existing.setBadge(body.getBadge());
        existing.setCtaLabel(body.getCtaLabel());
        existing.setCtaHref(body.getCtaHref());
        existing.setProductSlug(body.getProductSlug());
        existing.setPlacement(body.getPlacement());
        existing.setStyle(body.getStyle());
        existing.setOrder(body.getOrder());
        existing.setPublished(body.isPublished());
        existing.setStartsAt(body.getStartsAt());
        existing.setEndsAt(body.getEndsAt());
        HomePromo saved = repository.save(existing);
        events.publishEvent(new HomePromoChangedEvent(id));
        return saved;
    }

    @CacheEvict(value = "home", allEntries = true)
    public void delete(String id) {
        repository.deleteById(id);
        events.publishEvent(new HomePromoChangedEvent(id));
    }
}
