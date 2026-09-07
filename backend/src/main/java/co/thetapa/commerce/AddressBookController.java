package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Account address book (#158). Authed via the /api/v1/me/** matcher.
 * The GET response decorates each address with live pincode serviceability
 * (serviceable + etaDays) so the UI can say "We deliver here · ~3 days"
 * or hold the address for when the pincode opens.
 */
@RestController
@RequestMapping("/api/v1/me/addresses")
public class AddressBookController {

    private final SavedAddressRepository addresses;
    private final PincodeRepository pincodes;

    public AddressBookController(SavedAddressRepository addresses, PincodeRepository pincodes) {
        this.addresses = addresses;
        this.pincodes = pincodes;
    }

    public record AddressBody(String name, String phone, String line1, String line2,
                              String city, String state, String pincode, Boolean isDefault) {
    }

    public record AddressView(String id, String name, String phone, String line1, String line2,
                              String city, String state, String pincode, boolean isDefault,
                              boolean serviceable, Integer etaDays) {
    }

    private AddressView decorate(SavedAddress a) {
        var pin = pincodes.findByPincode(a.getPincode());
        boolean serviceable = pin.isPresent() && pin.get().isServiceable();
        Integer etaDays = serviceable ? pin.get().getEtaDays() : null;
        return new AddressView(a.getId(), a.getName(), a.getPhone(), a.getLine1(), a.getLine2(),
            a.getCity(), a.getState(), a.getPincode(), a.isDefault(), serviceable, etaDays);
    }

    @GetMapping
    public ApiResponse<List<AddressView>> list(@AuthenticationPrincipal String userId) {
        // default first, then oldest-first
        var all = new ArrayList<>(addresses.findByUserIdOrderByCreatedAtAsc(userId));
        all.sort((a, b) -> Boolean.compare(b.isDefault(), a.isDefault()));
        return ApiResponse.ok(all.stream().map(this::decorate).toList());
    }

    @PostMapping
    public ApiResponse<AddressView> create(@AuthenticationPrincipal String userId,
                                           @RequestBody AddressBody body) {
        validate(body);
        var existing = addresses.findByUserIdOrderByCreatedAtAsc(userId);
        SavedAddress a = new SavedAddress();
        a.setUserId(userId);
        apply(a, body);
        // the first address is always the default; an explicit flag takes over
        boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(body.isDefault());
        if (makeDefault) {
            clearDefault(existing);
        }
        a.setDefault(makeDefault);
        return ApiResponse.ok(decorate(addresses.save(a)));
    }

    @PutMapping("/{id}")
    public ApiResponse<AddressView> update(@AuthenticationPrincipal String userId,
                                           @PathVariable String id,
                                           @RequestBody AddressBody body) {
        validate(body);
        SavedAddress a = addresses.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("address", id));
        apply(a, body);
        if (Boolean.TRUE.equals(body.isDefault()) && !a.isDefault()) {
            clearDefault(addresses.findByUserIdOrderByCreatedAtAsc(userId));
            a.setDefault(true);
        }
        return ApiResponse.ok(decorate(addresses.save(a)));
    }

    @PostMapping("/{id}/default")
    public ApiResponse<AddressView> makeDefault(@AuthenticationPrincipal String userId,
                                                @PathVariable String id) {
        SavedAddress a = addresses.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("address", id));
        clearDefault(addresses.findByUserIdOrderByCreatedAtAsc(userId));
        a.setDefault(true);
        return ApiResponse.ok(decorate(addresses.save(a)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Object>> remove(@AuthenticationPrincipal String userId,
                                                   @PathVariable String id) {
        SavedAddress a = addresses.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("address", id));
        boolean wasDefault = a.isDefault();
        addresses.delete(a);
        if (wasDefault) {
            // quietly promote the oldest remaining address
            var remaining = addresses.findByUserIdOrderByCreatedAtAsc(userId);
            if (!remaining.isEmpty()) {
                SavedAddress next = remaining.get(0);
                next.setDefault(true);
                addresses.save(next);
            }
        }
        return ApiResponse.ok(Map.of("deleted", true));
    }

    private void apply(SavedAddress a, AddressBody body) {
        a.setName(body.name().trim());
        a.setPhone(body.phone() == null ? "" : body.phone().trim());
        a.setLine1(body.line1().trim());
        a.setLine2(body.line2() == null ? "" : body.line2().trim());
        a.setCity(body.city().trim());
        a.setState(body.state().trim());
        a.setPincode(body.pincode().trim());
    }

    private void clearDefault(List<SavedAddress> all) {
        List<SavedAddress> changed = all.stream()
            .filter(SavedAddress::isDefault)
            .peek(x -> x.setDefault(false))
            .toList();
        if (!changed.isEmpty()) {
            addresses.saveAll(changed);
        }
    }

    private void validate(AddressBody body) {
        List<String> errors = new ArrayList<>();
        if (isBlank(body.name())) errors.add("Add a name for this address.");
        if (isBlank(body.line1())) errors.add("Add the house / flat / building line.");
        if (isBlank(body.city())) errors.add("Add the city.");
        if (isBlank(body.state())) errors.add("Add the state.");
        if (body.pincode() == null || !body.pincode().trim().matches("\\d{6}")) {
            errors.add("The pincode should be 6 digits.");
        }
        if (!isBlank(body.phone()) && !body.phone().trim().matches("[6-9]\\d{9}")) {
            errors.add("The mobile number should be 10 digits.");
        }
        if (!errors.isEmpty()) {
            throw new ValidationFailedException(errors);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
