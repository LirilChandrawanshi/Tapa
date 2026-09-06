package co.thetapa.commerce;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PincodeRepository extends MongoRepository<PincodeServiceability, String> {

    Optional<PincodeServiceability> findByPincode(String pincode);
}
