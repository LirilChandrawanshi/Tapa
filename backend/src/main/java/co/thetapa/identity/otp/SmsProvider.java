package co.thetapa.identity.otp;

/**
 * Pluggable SMS/WhatsApp OTP delivery. Local dev logs the code; production
 * binds MSG91/Twilio/Gupshup behind the same contract.
 */
public interface SmsProvider {

    void sendOtp(String phoneE164, String code);
}
