package co.thetapa.identity.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(name = "productionSmsProvider")
public class ConsoleSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(ConsoleSmsProvider.class);

    @Override
    public void sendOtp(String phoneE164, String code) {
        log.info("[DEV OTP] {} -> {}", phoneE164, code);
    }
}
