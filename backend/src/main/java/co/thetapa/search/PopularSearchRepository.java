package co.thetapa.search;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PopularSearchRepository extends MongoRepository<SearchModels.PopularSearch, String> {

    List<SearchModels.PopularSearch> findByActiveTrueOrderByOrderAsc();
}
