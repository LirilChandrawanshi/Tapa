package co.thetapa.booking;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends MongoRepository<Booking, String> {

    Optional<Booking> findByBookingNumber(String bookingNumber);

    List<Booking> findByPhoneOrderByCreatedAtDesc(String phone);

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findByPurohitSlugAndDateAndStatusIn(String purohitSlug, LocalDate date,
                                                      List<Booking.Status> statuses);

    List<Booking> findByStatusOrderByDateAsc(Booking.Status status);

    List<Booking> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}
