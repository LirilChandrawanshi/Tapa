package co.thetapa.homesections;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HomePromoRepository extends MongoRepository<HomePromo, String> {

    List<HomePromo> findAllByOrderByPlacementAscOrderAsc();
}
