package co.thetapa.ritualcard;

/**
 * Published when an observance's panchang/timing data changes (the admin
 * module will publish this in M9). Carries the observance slug so listeners
 * can find affected articles via
 * {@code ArticleRepository.findByLinkedObservanceSlug}.
 */
public record PanchangDayUpdatedEvent(String observanceSlug) {
}
