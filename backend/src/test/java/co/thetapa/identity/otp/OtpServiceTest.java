package co.thetapa.identity.otp;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OtpServiceTest {

    @Test
    void normalizesBareTenDigitNumber() {
        assertThat(OtpService.normalize("9876543210")).isEqualTo("+919876543210");
    }

    @Test
    void normalizesPlusNinetyOneAndSpacing() {
        assertThat(OtpService.normalize("+91 98765 43210")).isEqualTo("+919876543210");
        assertThat(OtpService.normalize("919876543210")).isEqualTo("+919876543210");
    }

    @Test
    void rejectsShortAndForeignNumbers() {
        assertThatThrownBy(() -> OtpService.normalize("12345"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OtpService.normalize("+14155550100"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OtpService.normalize(null))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
