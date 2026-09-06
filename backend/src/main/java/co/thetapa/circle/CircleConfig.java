package co.thetapa.circle;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Wiring for the Tapa Circle module. Enables scheduling for the app (the T2
 * evening reminder and the DELETE purge job live in {@link CircleReminderScheduler}).
 */
@Configuration
@EnableScheduling
public class CircleConfig {

    /**
     * Console fallback provider. A production Gupshup/Interakt adapter simply
     * declares a bean named {@code productionWhatsAppProvider} and this one
     * backs off.
     */
    @Bean
    @ConditionalOnMissingBean(name = "productionWhatsAppProvider")
    WhatsAppProvider consoleWhatsAppProvider() {
        return new ConsoleWhatsAppProvider();
    }
}
