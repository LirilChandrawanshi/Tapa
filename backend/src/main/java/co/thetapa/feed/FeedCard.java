package co.thetapa.feed;

public record FeedCard(
    String id,
    FeedItem.RefType refType,
    String title,
    String imageUrl,
    String subtitle,
    String href,
    String caption,
    int order,
    String hueClass,
    FeedItem.Layout layout,
    String badge,
    String ctaLabel
) {}
