package co.thetapa.feed;

import co.thetapa.commerce.ProductRepository;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.panchang.ObservanceRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class FeedService {

    private static final Map<String, String> DEITY_HUE = Map.ofEntries(
        Map.entry("shiva", "h-shiva"),
        Map.entry("ganesha", "h-ganesh"),
        Map.entry("vishnu", "h-vishnu"),
        Map.entry("krishna", "h-vishnu"),
        Map.entry("parvati", "h-devi"),
        Map.entry("devi", "h-devi"),
        Map.entry("durga", "h-devi"),
        Map.entry("lakshmi", "h-devi"),
        Map.entry("saraswati", "h-devi"),
        Map.entry("pitru", "h-earth")
    );

    private final FeedItemRepository repository;
    private final ProductRepository productRepo;
    private final ArticleRepository articleRepo;
    private final ObservanceRepository observanceRepo;
    private final GlossaryRepository glossaryRepo;
    private final ApplicationEventPublisher events;

    public FeedService(FeedItemRepository repository, ProductRepository productRepo,
                       ArticleRepository articleRepo, ObservanceRepository observanceRepo,
                       GlossaryRepository glossaryRepo, ApplicationEventPublisher events) {
        this.repository = repository;
        this.productRepo = productRepo;
        this.articleRepo = articleRepo;
        this.observanceRepo = observanceRepo;
        this.glossaryRepo = glossaryRepo;
        this.events = events;
    }

    @Cacheable("feed")
    public List<FeedCard> publicFeed() {
        return repository.findByPublishedTrueOrderByOrderAsc().stream()
            .map(this::hydrate)
            .filter(Objects::nonNull)
            .toList();
    }

    public List<FeedItem> allItems() {
        return repository.findAllByOrderByOrderAsc();
    }

    @CacheEvict(value = "feed", allEntries = true)
    public FeedItem create(FeedItem item) {
        FeedItem saved = repository.save(item);
        events.publishEvent(new FeedChangedEvent());
        return saved;
    }

    @CacheEvict(value = "feed", allEntries = true)
    public FeedItem update(String id, FeedItem updates) {
        return repository.findById(id).map(existing -> {
            existing.setRefType(updates.getRefType());
            existing.setRefId(updates.getRefId());
            existing.setExternalUrl(updates.getExternalUrl());
            existing.setLinkTitle(updates.getLinkTitle());
            existing.setHeadline(updates.getHeadline());
            existing.setBadge(updates.getBadge());
            existing.setCtaLabel(updates.getCtaLabel());
            existing.setCtaHref(updates.getCtaHref());
            existing.setCaption(updates.getCaption());
            existing.setImageId(updates.getImageId());
            existing.setHueClass(updates.getHueClass());
            existing.setLayout(updates.getLayout());
            existing.setOrder(updates.getOrder());
            existing.setPublished(updates.isPublished());
            FeedItem saved = repository.save(existing);
            events.publishEvent(new FeedChangedEvent());
            return saved;
        }).orElseThrow();
    }

    @CacheEvict(value = "feed", allEntries = true)
    public void delete(String id) {
        repository.deleteById(id);
        events.publishEvent(new FeedChangedEvent());
    }

    private FeedCard hydrate(FeedItem item) {
        FeedItem.Layout layout = item.getLayout() != null ? item.getLayout() : FeedItem.Layout.STANDARD;
        return switch (item.getRefType()) {
            case PRODUCT -> productRepo.findById(item.getRefId())
                .map(p -> new FeedCard(item.getId(), FeedItem.RefType.PRODUCT, p.getTitle(),
                    mediaUrl(item.getImageId() != null ? item.getImageId()
                        : (p.getImageIds() == null || p.getImageIds().isEmpty())
                            ? null : p.getImageIds().get(0)),
                    formatPaise(p.getPricePaise()), "/ritual-pujans/p/" + p.getSlug(),
                    item.getCaption(), item.getOrder(),
                    firstNonNull(item.getHueClass(), p.getHueClass(), "h-gold"),
                    layout, "Ritual Pujans", "Shop this kit"))
                .orElse(null);
            case ARTICLE -> articleRepo.findById(item.getRefId())
                .map(a -> {
                    var en = a.getLang().get("en");
                    return new FeedCard(item.getId(), FeedItem.RefType.ARTICLE, en.title(),
                        mediaUrl(item.getImageId() != null ? item.getImageId() : a.getHeroImageId()),
                        a.getCategory(), articleHref(a), item.getCaption(), item.getOrder(),
                        firstNonNull(item.getHueClass(), a.getHueClass(), "h-devi"),
                        layout, "Ritual Guide", "Read the guide");
                })
                .orElse(null);
            case OBSERVANCE -> observanceRepo.findById(item.getRefId())
                .map(o -> new FeedCard(item.getId(), FeedItem.RefType.OBSERVANCE, o.getName(),
                    mediaUrl(item.getImageId() != null ? item.getImageId() : o.getHeroImageId()),
                    o.getDate() != null ? o.getDate().toString() : null,
                    "/panchang/o/" + o.getSlug(), item.getCaption(), item.getOrder(),
                    firstNonNull(item.getHueClass(), hueForDeity(o.getDeity()), "h-gold"),
                    layout, "Panchang", "See the observance"))
                .orElse(null);
            case GLOSSARY_TERM -> glossaryRepo.findById(item.getRefId())
                .map(g -> new FeedCard(item.getId(), FeedItem.RefType.GLOSSARY_TERM, g.getTerm(),
                    mediaUrl(item.getImageId()), null, "/glossary",
                    item.getCaption(), item.getOrder(),
                    firstNonNull(item.getHueClass(), "h-sanskar"),
                    layout, "Glossary", "Look it up"))
                .orElse(null);
            case LINK -> new FeedCard(item.getId(), FeedItem.RefType.LINK, item.getLinkTitle(),
                mediaUrl(item.getImageId()), null, item.getExternalUrl(),
                item.getCaption(), item.getOrder(),
                firstNonNull(item.getHueClass(), "h-data"),
                layout, null, "Open");
            case PROMO -> new FeedCard(item.getId(), FeedItem.RefType.PROMO,
                firstNonNull(item.getHeadline(), item.getCaption(), "Tapa"),
                mediaUrl(item.getImageId()), null,
                firstNonNull(item.getCtaHref(), "/"),
                item.getCaption(), item.getOrder(),
                firstNonNull(item.getHueClass(), "h-gold"),
                layout, item.getBadge(),
                firstNonNull(item.getCtaLabel(), "Learn more"));
        };
    }

    /** Accepts either an internal media asset id or a full external URL
     *  (e.g. a stock-photo placeholder) — external URLs pass through as-is. */
    private String mediaUrl(String mediaId) {
        if (mediaId == null) return null;
        if (mediaId.startsWith("http://") || mediaId.startsWith("https://")) return mediaId;
        return "/api/v1/media/" + mediaId;
    }

    private String formatPaise(long paise) {
        return "₹" + (paise / 100);
    }

    private String articleHref(Article a) {
        String base = "dharmic-concepts".equals(a.getCategory()) ? "/dharmic-concepts" : "/ritual-guides";
        return base + "/" + (a.getSubCategory() != null ? a.getSubCategory() : "all") + "/" + a.getSlug();
    }

    private String hueForDeity(String deity) {
        if (deity == null) return null;
        return DEITY_HUE.get(deity.toLowerCase());
    }

    private static String firstNonNull(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    public record FeedChangedEvent() {}
}
