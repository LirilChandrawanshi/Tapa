package co.thetapa.ritualcard;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Enables @Async so card regeneration runs off the publishing request thread. */
@Configuration
@EnableAsync
public class RitualCardConfig {
}
