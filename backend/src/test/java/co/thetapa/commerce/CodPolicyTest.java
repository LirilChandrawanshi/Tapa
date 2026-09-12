package co.thetapa.commerce;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CodPolicyTest {

    @Test
    void rupeesUsesEnInGroupingAtEveryMagnitude() {
        assertThat(CodPolicy.rupees(0)).isEqualTo("₹0");
        assertThat(CodPolicy.rupees(9_900)).isEqualTo("₹99");
        assertThat(CodPolicy.rupees(80_000)).isEqualTo("₹800");     // was "₹8,00,"
        assertThat(CodPolicy.rupees(99_900)).isEqualTo("₹999");
        assertThat(CodPolicy.rupees(100_000)).isEqualTo("₹1,000");
        assertThat(CodPolicy.rupees(500_000)).isEqualTo("₹5,000");
        assertThat(CodPolicy.rupees(10_000_000)).isEqualTo("₹1,00,000");
        assertThat(CodPolicy.rupees(123_456_700)).isEqualTo("₹12,34,567");
    }

    @Test
    void everyGateIsIndependent() {
        PincodeServiceability cod = new PincodeServiceability("110024", true, 3, "Lajpat Nagar");
        cod.setCodAllowed(true);
        PincodeServiceability noCod = new PincodeServiceability("110025", true, 3, "Nizamuddin");

        assertThat(new CodPolicy(false, 500_000, 0, false).rejectionReason(1_000, false, cod))
            .contains("isn't available yet");
        assertThat(new CodPolicy(true, 500_000, 0, false).rejectionReason(1_000, false, noCod))
            .contains("this pincode");
        assertThat(new CodPolicy(true, 500_000, 0, false).rejectionReason(1_000, false, null))
            .contains("this pincode");
        assertThat(new CodPolicy(true, 500_000, 0, false).rejectionReason(600_000, false, cod))
            .contains("up to ₹5,000");
        assertThat(new CodPolicy(true, 500_000, 0, false).rejectionReason(1_000, true, cod))
            .contains("paid for up front");
        // all gates open
        assertThat(new CodPolicy(true, 500_000, 0, false).rejectionReason(1_000, false, cod)).isNull();
        // prebook explicitly permitted
        assertThat(new CodPolicy(true, 500_000, 0, true).rejectionReason(1_000, true, cod)).isNull();
    }
}
