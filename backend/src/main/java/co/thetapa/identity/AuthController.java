package co.thetapa.identity;

import co.thetapa.common.ApiResponse;
import co.thetapa.identity.otp.OtpService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    static final String ACCESS_COOKIE = "tapa_access";
    static final String REFRESH_COOKIE = "tapa_refresh";

    private final OtpService otpService;
    private final JwtService jwtService;
    private final UserRepository users;

    public AuthController(OtpService otpService, JwtService jwtService, UserRepository users) {
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.users = users;
    }

    public record PhoneRequest(@NotBlank String phone) {
    }

    public record VerifyRequest(@NotBlank String phone, @NotBlank String code) {
    }

    @PostMapping("/otp/request")
    public ApiResponse<Map<String, Object>> requestOtp(@RequestBody PhoneRequest body) {
        var result = otpService.request(body.phone());
        return ApiResponse.ok(Map.of("sent", true, "resendAfterSeconds", result.resendAfterSeconds()));
    }

    @PostMapping("/otp/verify")
    public ApiResponse<Map<String, Object>> verifyOtp(@RequestBody VerifyRequest body,
                                                      HttpServletResponse response) {
        String phone = otpService.verify(body.phone(), body.code());

        User user = users.findByPhone(phone).orElseGet(() -> {
            User u = new User();
            u.setPhone(phone);
            return u;
        });
        user.setLastActiveAt(Instant.now());

        String refresh = jwtService.newRefreshToken();
        user.getRefreshTokens().add(jwtService.hashRefreshToken(refresh));
        if (user.getRefreshTokens().size() > 5) {
            user.setRefreshTokens(user.getRefreshTokens()
                .subList(user.getRefreshTokens().size() - 5, user.getRefreshTokens().size()));
        }
        users.save(user);

        setAuthCookies(response, jwtService.issueAccessToken(user), refresh);
        return ApiResponse.ok(Map.of(
            "user", Map.of(
                "phone", user.getPhone(),
                "name", Optional.ofNullable(user.getName()).orElse(""),
                "languagePref", user.getLanguagePref(),
                "isNew", user.getName() == null
            )
        ));
    }

    @PostMapping("/refresh")
    public ApiResponse<Map<String, Object>> refresh(HttpServletRequest request, HttpServletResponse response) {
        String token = cookieValue(request, REFRESH_COOKIE)
            .orElseThrow(() -> new OtpService.OtpInvalidException("No session."));
        String hash = jwtService.hashRefreshToken(token);
        User user = users.findByRefreshTokensContaining(hash)
            .orElseThrow(() -> new OtpService.OtpInvalidException("Session expired. Sign in again."));

        // rotate
        user.getRefreshTokens().remove(hash);
        String newRefresh = jwtService.newRefreshToken();
        user.getRefreshTokens().add(jwtService.hashRefreshToken(newRefresh));
        user.setLastActiveAt(Instant.now());
        users.save(user);

        setAuthCookies(response, jwtService.issueAccessToken(user), newRefresh);
        return ApiResponse.ok(Map.of("refreshed", true));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, Object>> logout(HttpServletRequest request, HttpServletResponse response) {
        cookieValue(request, REFRESH_COOKIE).ifPresent(token -> {
            String hash = jwtService.hashRefreshToken(token);
            users.findByRefreshTokensContaining(hash)
                .ifPresent(u -> {
                    u.getRefreshTokens().remove(hash);
                    users.save(u);
                });
        });
        clearCookie(response, ACCESS_COOKIE);
        clearCookie(response, REFRESH_COOKIE);
        return ApiResponse.ok(Map.of("loggedOut", true));
    }

    private void setAuthCookies(HttpServletResponse response, String access, String refresh) {
        addCookie(response, ACCESS_COOKIE, access, (int) jwtService.accessTtl().getSeconds());
        addCookie(response, REFRESH_COOKIE, refresh, (int) jwtService.refreshTtl().getSeconds());
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearCookie(HttpServletResponse response, String name) {
        addCookie(response, name, "", 0);
    }

    static Optional<String> cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
            .filter(c -> c.getName().equals(name))
            .map(Cookie::getValue)
            .findFirst();
    }

    @ExceptionHandler(OtpService.OtpThrottledException.class)
    ResponseEntity<ApiResponse<Void>> throttled(OtpService.OtpThrottledException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
            .body(ApiResponse.fail("otp_throttled", e.getMessage()));
    }

    @ExceptionHandler(OtpService.OtpInvalidException.class)
    ResponseEntity<ApiResponse<Void>> invalid(OtpService.OtpInvalidException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.fail("otp_invalid", e.getMessage()));
    }
}
