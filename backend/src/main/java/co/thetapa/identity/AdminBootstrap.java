package co.thetapa.identity;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Ensures the phones listed in {@code tapa.admin.phones} (comma-separated,
 * env override {@code TAPA_ADMIN_PHONES}) always carry the ADMIN role.
 *
 * Dev flow: the default below is the dev test number — sign in via OTP with
 * that phone (any 6-digit code is echoed to the backend console by
 * {@code ConsoleSmsProvider}) and you are an admin; /admin unlocks with no
 * further setup. If the user does not exist yet, a stub user is created so
 * the role is already present on first OTP sign-in.
 */
@Component
public class AdminBootstrap {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    static final String ADMIN_ROLE = "ADMIN";

    private final UserRepository users;
    private final String phonesCsv;

    public AdminBootstrap(UserRepository users,
                          @Value("${tapa.admin.phones:+919876543210}") String phonesCsv) {
        this.users = users;
        this.phonesCsv = phonesCsv;
    }

    @PostConstruct
    void ensureAdmins() {
        if (phonesCsv == null || phonesCsv.isBlank()) {
            return;
        }
        for (String raw : phonesCsv.split(",")) {
            String phone = raw.trim();
            if (phone.isEmpty()) {
                continue;
            }
            User user = users.findByPhone(phone).orElseGet(() -> {
                User stub = new User();
                stub.setPhone(phone);
                return stub;
            });
            if (!user.getRoles().contains(ADMIN_ROLE)) {
                user.getRoles().add(ADMIN_ROLE);
                users.save(user);
                log.info("admin bootstrap: granted ADMIN to {}", phone);
            }
        }
    }
}
