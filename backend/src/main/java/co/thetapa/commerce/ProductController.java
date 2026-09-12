package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ProductController {

    private final ProductRepository products;
    private final PincodeRepository pincodes;
    private final CodPolicy codPolicy;

    public ProductController(ProductRepository products, PincodeRepository pincodes,
                             CodPolicy codPolicy) {
        this.codPolicy = codPolicy;
        this.products = products;
        this.pincodes = pincodes;
    }

    @GetMapping("/products")
    public ApiResponse<List<Product>> list(@RequestParam(required = false) String category) {
        return ApiResponse.ok(category == null
            ? products.findAllByOrderByFestivalDateAsc()
            : products.findByCategoryOrderByFestivalDateAsc(category));
    }

    @GetMapping("/products/{slug}")
    public ApiResponse<Product> get(@PathVariable String slug) {
        return ApiResponse.ok(products.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("product", slug)));
    }

    /**
     * Pincode check. Delivery note language is locked micro-copy on the client;
     * this returns the facts only. Unknown pincode = not serviceable yet.
     */
    @GetMapping("/pincode/{pincode}")
    public ApiResponse<Map<String, Object>> pincode(@PathVariable String pincode) {
        if (!pincode.matches("[1-9][0-9]{5}")) {
            throw new IllegalArgumentException("Enter a valid 6-digit pincode.");
        }
        // codAllowed is the AND of the master switch and this pincode's own flag,
        // so the client never has to know the policy — it just renders the answer.
        return ApiResponse.ok(pincodes.findByPincode(pincode)
            .map(p -> Map.<String, Object>of(
                "serviceable", p.isServiceable(),
                "etaDays", p.getEtaDays(),
                "codAllowed", codPolicy.isEnabled() && p.isCodAllowed(),
                "codMaxPaise", codPolicy.maxOrderPaise(),
                "codFeePaise", codPolicy.feePaise(),
                "codOnPrebook", codPolicy.allowsPrebook(),
                "area", p.getArea() == null ? "" : p.getArea()))
            .orElse(Map.of("serviceable", false)));
    }
}
