package co.thetapa.feed;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FeedItemRepository extends MongoRepository<FeedItem, String> {
    List<FeedItem> findByPublishedTrueOrderByOrderAsc();
    List<FeedItem> findAllByOrderByOrderAsc();
}
