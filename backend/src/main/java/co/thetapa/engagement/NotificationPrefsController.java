package co.thetapa.engagement;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Notification preferences grouped by purpose (#181).
 *
 * Reminder channels default ON (the user asked for the reminder); marketing
 * defaults OFF — strictly opt-in, per DPDP consent rules. Order/dispatch
 * messages are transactional and have no preference key at all: they are
 * always sent, so a buyer can never miss a dispatch update.
 */
@RestController
@RequestMapping("/api/v1/me/prefs")
public class NotificationPrefsController {

    /** key → default. Insertion order is the display order. */
    static final Map<String, Boolean> DEFAULTS;

    static {
        Map<String, Boolean> d = new LinkedHashMap<>();
        d.put("ritual_reminders_whatsapp", true);
        d.put("ritual_reminders_sms_fallback", true);
        d.put("updates_new_guides", false);
        d.put("updates_kit_launches", false);
        DEFAULTS = Map.copyOf(d);
    }

    private final UserRepository users;

    public NotificationPrefsController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    public ApiResponse<Map<String, Boolean>> get(@AuthenticationPrincipal String userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
        return ApiResponse.ok(merged(user));
    }

    @PutMapping
    public ApiResponse<Map<String, Boolean>> update(@AuthenticationPrincipal String userId,
                                                    @RequestBody Map<String, Boolean> body) {
        User user = users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
        Map<String, Boolean> prefs = user.getNotificationPrefs() == null
            ? new HashMap<>() : new HashMap<>(user.getNotificationPrefs());
        for (Map.Entry<String, Boolean> e : body.entrySet()) {
            if (!DEFAULTS.containsKey(e.getKey())) {
                throw new IllegalArgumentException("Unknown preference: " + e.getKey());
            }
            if (e.getValue() == null) {
                throw new IllegalArgumentException("Preference " + e.getKey() + " must be true or false.");
            }
            prefs.put(e.getKey(), e.getValue());
        }
        user.setNotificationPrefs(prefs);
        users.save(user);
        return ApiResponse.ok(merged(user));
    }

    private static Map<String, Boolean> merged(User user) {
        Map<String, Boolean> out = new LinkedHashMap<>();
        Map<String, Boolean> stored = user.getNotificationPrefs();
        for (Map.Entry<String, Boolean> e : DEFAULTS.entrySet()) {
            Boolean v = stored == null ? null : stored.get(e.getKey());
            out.put(e.getKey(), v != null ? v : e.getValue());
        }
        return out;
    }
}
