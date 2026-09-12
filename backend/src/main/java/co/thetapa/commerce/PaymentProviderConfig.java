package co.thetapa.commerce;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * One explicit fork instead of two competing @Component beans: with Razorpay
 * credentials present the gateway is bound, otherwise the mock carries dev as
 * it always has. Stating it here means the choice is readable in one place and
 * is logged at boot, rather than depending on bean-definition ordering.
 */
@Configuration
@EnableConfigurationProperties(RazorpayProperties.class)
public class PaymentProviderConfig {

    private static final Logger log = LoggerFactory.getLogger(PaymentProviderConfig.class);

    @Bean
    public PaymentProvider paymentProvider(RazorpayProperties props, ObjectMapper json) {
        if (!props.enabled()) {
            log.info("[payments] no tapa.razorpay.key-id — using the mock provider "
                + "(dev checkout confirms itself; no gateway call, no webhook)");
            return new MockPaymentProvider();
        }
        if (!props.testMode()) {
            log.warn("[payments] Razorpay key is a LIVE key — real money will move.");
        }
        if (props.webhookSecret().isBlank()) {
            log.warn("[payments] tapa.razorpay.webhook-secret is unset — webhook deliveries "
                + "will be rejected as unverified. Set it to the secret you typed into the "
                + "Razorpay Dashboard when creating the webhook.");
        }
        log.info("[payments] Razorpay bound in {} mode (key {})",
            props.testMode() ? "TEST" : "LIVE", props.keyId());
        return new RazorpayPaymentProvider(props, json);
    }
}
