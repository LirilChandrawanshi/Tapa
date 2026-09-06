package co.thetapa.taxonomy;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TaxonomyRepository extends MongoRepository<Taxonomy, String> {
}
