package co.thetapa.identity;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByRefreshTokensContaining(String refreshTokenHash);
}
