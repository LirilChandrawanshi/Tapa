package co.thetapa.search;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService service;
    private final PopularSearchRepository popular;

    public SearchController(SearchService service, PopularSearchRepository popular) {
        this.service = service;
        this.popular = popular;
    }

    @GetMapping
    public ApiResponse<SearchModels.SearchResponse> search(@RequestParam(defaultValue = "") String q) {
        return ApiResponse.ok(service.search(q));
    }

    @GetMapping("/popular")
    public ApiResponse<List<SearchModels.PopularSearch>> popular() {
        return ApiResponse.ok(popular.findByActiveTrueOrderByOrderAsc());
    }
}
