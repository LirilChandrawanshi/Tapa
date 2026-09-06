package co.thetapa.circle;

import java.util.Map;

/**
 * Outbound WhatsApp gateway abstraction for the Tapa Circle.
 *
 * <p>Two send shapes exist on the WhatsApp Business API and both are modeled here:</p>
 * <ul>
 *   <li>{@link #sendTemplate} — pre-approved UTILITY templates (T1/T2/T3), the only
 *       way to message a user outside the 24h service window;</li>
 *   <li>{@link #sendText} — a plain session message, valid only inside the 24h
 *       window opened by an inbound message (used for canned service replies).</li>
 * </ul>
 *
 * <h2>How a Gupshup adapter maps</h2>
 * <pre>
 * POST https://api.gupshup.io/wa/api/v1/template/msg
 *   source        = tapa.circle.wa-number
 *   destination   = waNumber (digits only, strip '+')
 *   template      = {"id": &lt;template UUID for templateName+language&gt;,
 *                    "params": [vars "1", "2", ... in ascending key order]}
 *   message       = {"type":"image","image":{"link": headerImageUrl}}   // only when non-null
 *   → response.messageId  becomes the returned provider message id
 * sendText → POST /wa/api/v1/msg with message={"type":"text","text": text}
 * </pre>
 *
 * <h2>How an Interakt adapter maps</h2>
 * <pre>
 * POST https://api.interakt.ai/v1/public/message/
 *   fullPhoneNumber = waNumber
 *   type            = "Template"
 *   template = {"name": templateName, "languageCode": language ("en"/"hi_IN"),
 *               "headerValues": [headerImageUrl]          // omit when null
 *               "bodyValues":  [vars "1", "2", ... in ascending key order]}
 *   → response.result.message_id becomes the returned provider message id
 * sendText → same endpoint with type="Text", data.message=text
 * </pre>
 *
 * <p>Vars are keyed by positional placeholder ("1" → {{1}}). A var the spec marks
 * as omitted (e.g. blank circle teaser) is simply absent from the map; the adapter
 * must map the remaining keys onto the matching approved template variant.</p>
 *
 * <p>Implementations MUST throw {@link WhatsAppSendException} (or any RuntimeException)
 * on failure — the caller owns the one-retry-after-60s rule and never retries beyond it.</p>
 *
 * <p>To go live, register a bean NAMED {@code productionWhatsAppProvider}; the
 * console fallback backs off automatically (see {@link CircleConfig}).</p>
 */
public interface WhatsAppProvider {

    /**
     * Sends an approved template message.
     *
     * @param templateName   approved template, e.g. "tapa_circle_reminder"
     * @param waNumber       destination in E.164 ("+91...")
     * @param language       template language code ("en" or "hi_IN")
     * @param vars           positional body variables keyed "1".."7"; omitted keys are omitted placeholders
     * @param headerImageUrl header image (T2 article hero) or null for no header
     * @return provider message id
     * @throws WhatsAppSendException on any delivery-submission failure
     */
    String sendTemplate(String templateName, String waNumber, String language,
                        Map<String, String> vars, String headerImageUrl);

    /**
     * Sends a plain session (service-window) text message.
     *
     * @return provider message id
     * @throws WhatsAppSendException on any delivery-submission failure
     */
    String sendText(String waNumber, String text);

    class WhatsAppSendException extends RuntimeException {
        public WhatsAppSendException(String message, Throwable cause) {
            super(message, cause);
        }

        public WhatsAppSendException(String message) {
            super(message);
        }
    }
}
