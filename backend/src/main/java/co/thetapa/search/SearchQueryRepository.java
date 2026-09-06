package co.thetapa.search;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SearchQueryRepository extends MongoRepository<SearchModels.SearchQuery, String> {

    List<SearchModels.SearchQuery> findByResultCountOrderByAtDesc(int resultCount, Pageable pageable);
}
