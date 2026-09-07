package co.thetapa.commerce;

import co.thetapa.common.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AddressBookControllerTest {

    private static final String USER = "user-1";

    private SavedAddressRepository addresses;
    private PincodeRepository pincodes;
    private AddressBookController controller;

    @BeforeEach
    void setUp() {
        addresses = Mockito.mock(SavedAddressRepository.class);
        pincodes = Mockito.mock(PincodeRepository.class);
        controller = new AddressBookController(addresses, pincodes);
        when(addresses.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(pincodes.findByPincode("110024"))
            .thenReturn(Optional.of(new PincodeServiceability("110024", true, 3, "Lajpat Nagar")));
        when(pincodes.findByPincode("560001")).thenReturn(Optional.empty());
    }

    private AddressBookController.AddressBody body(String pincode) {
        return new AddressBookController.AddressBody(
            "Asha", "9812340001", "12 Lajpat Nagar", null, "New Delhi", "Delhi", pincode, null);
    }

    @Test
    void firstAddressBecomesDefaultAndIsDecoratedServiceable() {
        when(addresses.findByUserIdOrderByCreatedAtAsc(USER)).thenReturn(List.of());
        var res = controller.create(USER, body("110024"));
        assertThat(res.data().isDefault()).isTrue();
        assertThat(res.data().serviceable()).isTrue();
        assertThat(res.data().etaDays()).isEqualTo(3);
    }

    @Test
    void unservedPincodeIsStillSavedJustMarkedNotServiceable() {
        when(addresses.findByUserIdOrderByCreatedAtAsc(USER)).thenReturn(List.of());
        var res = controller.create(USER, body("560001"));
        assertThat(res.data().serviceable()).isFalse();
        assertThat(res.data().etaDays()).isNull();
    }

    @Test
    void badPincodeIsRejected() {
        assertThatThrownBy(() -> controller.create(USER, body("12")))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("6 digits");
    }

    @Test
    void updateAndSetDefaultHappyPath() {
        SavedAddress existing = new SavedAddress();
        existing.setId("a1");
        existing.setUserId(USER);
        existing.setDefault(false);
        SavedAddress current = new SavedAddress();
        current.setId("a0");
        current.setUserId(USER);
        current.setDefault(true);
        when(addresses.findByIdAndUserId("a1", USER)).thenReturn(Optional.of(existing));
        when(addresses.findByUserIdOrderByCreatedAtAsc(USER)).thenReturn(List.of(current, existing));

        var res = controller.makeDefault(USER, "a1");
        assertThat(res.data().isDefault()).isTrue();
        assertThat(current.isDefault()).isFalse();
    }

    @Test
    void deletingTheDefaultPromotesTheOldestRemaining() {
        SavedAddress dying = new SavedAddress();
        dying.setId("a0");
        dying.setUserId(USER);
        dying.setDefault(true);
        SavedAddress survivor = new SavedAddress();
        survivor.setId("a1");
        survivor.setUserId(USER);
        when(addresses.findByIdAndUserId("a0", USER)).thenReturn(Optional.of(dying));
        when(addresses.findByUserIdOrderByCreatedAtAsc(USER)).thenReturn(List.of(survivor));

        var res = controller.remove(USER, "a0");
        assertThat(res.data().get("deleted")).isEqualTo(true);
        assertThat(survivor.isDefault()).isTrue();
    }
}
