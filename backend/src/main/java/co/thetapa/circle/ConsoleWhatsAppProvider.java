package co.thetapa.circle;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Dev/local provider: renders the would-be WhatsApp message to the log and
 * returns a fake provider message id. Registered by {@link CircleConfig} only
 * when no bean named {@code productionWhatsAppProvider} exists.
 */
public class ConsoleWhatsAppProvider implements WhatsAppProvider {

    private static final Logger log = LoggerFactory.getLogger(ConsoleWhatsAppProvider.class);

    @Override
    public String sendTemplate(String templateName, String waNumber, String language,
                               Map<String, String> vars, String headerImageUrl) {
        String id = "console-" + UUID.randomUUID();
        log.info("[WA→{}] template={} lang={} header={} vars={} (providerMessageId={})",
            waNumber, templateName, language,
            headerImageUrl == null ? "-" : headerImageUrl,
            new TreeMap<>(vars), id);
        return id;
    }

    @Override
    public String sendText(String waNumber, String text) {
        String id = "console-" + UUID.randomUUID();
        log.info("[WA→{}] text=\"{}\" (providerMessageId={})", waNumber, text, id);
        return id;
    }
}
