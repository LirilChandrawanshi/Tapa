package co.thetapa.ritualcard;

import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleService;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Regenerates ritual-card PDFs off the request thread when their inputs
 * change: article publish, or a panchang update touching a linked observance.
 * Regeneration is hash-guarded inside the service, so redundant events are
 * cheap no-ops.
 */
@Component
public class RitualCardEvents {

    private final RitualCardService service;
    private final ArticleRepository articles;

    public RitualCardEvents(RitualCardService service, ArticleRepository articles) {
        this.service = service;
        this.articles = articles;
    }

    @Async
    @EventListener
    public void onArticlePublished(ArticleService.ArticlePublishedEvent event) {
        service.regenerateQuietly(event.slug());
    }

    @Async
    @EventListener
    public void onPanchangDayUpdated(PanchangDayUpdatedEvent event) {
        articles.findByLinkedObservanceSlug(event.observanceSlug())
            .forEach(article -> service.regenerateQuietly(article.getSlug()));
    }
}
