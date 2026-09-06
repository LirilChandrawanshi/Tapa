package co.thetapa.commerce;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {

    Optional<Product> findBySlug(String slug);

    List<Product> findByCategoryOrderByFestivalDateAsc(String category);

    List<Product> findAllByOrderByFestivalDateAsc();

    List<Product> findByAvailabilityOrderByFestivalDateAsc(Product.Availability availability);
}
