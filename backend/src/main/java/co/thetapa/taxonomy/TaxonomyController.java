package co.thetapa.taxonomy;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/taxonomy")
public class TaxonomyController {

    private final TaxonomyService service;

    public TaxonomyController(TaxonomyService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<Taxonomy> get() {
        return ApiResponse.ok(service.get());
    }
}
