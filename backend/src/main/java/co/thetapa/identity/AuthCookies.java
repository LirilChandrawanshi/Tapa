package co.thetapa.identity;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Cookie names + clearing helper shared outside the identity package
 * (e.g. account deletion ends the session in the same response).
 * Names must stay in step with {@link AuthController}.
 */
public final class AuthCookies {

    public static final String ACCESS_COOKIE = "tapa_access";
    public static final String REFRESH_COOKIE = "tapa_refresh";

    private AuthCookies() {
    }

    /** Expires both auth cookies on the response — the browser session ends immediately. */
    public static void clear(HttpServletResponse response) {
        for (String name : new String[]{ACCESS_COOKIE, REFRESH_COOKIE}) {
            Cookie cookie = new Cookie(name, "");
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(0);
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);
        }
    }
}
