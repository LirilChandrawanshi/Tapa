package co.thetapa.content;

import co.thetapa.common.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/articles")
public class ArticleController {

    private final ArticleService service;
    private final co.thetapa.imagery.DeityImageService imagery;

    public ArticleController(ArticleService service,
                             co.thetapa.imagery.DeityImageService imagery) {
        this.service = service;
        this.imagery = imagery;
    }

    @GetMapping("/{slug}")
    public ApiResponse<Article> get(@PathVariable String slug) {
        return ApiResponse.ok(service.getPublished(slug));
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String subCategory,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "24") int size) {
        Page<Article> result = service.listPublished(category, subCategory, page, size);
        result.getContent().forEach(a -> a.setResolvedImageId(imagery.imageForArticle(a)));
        return ApiResponse.ok(Map.of(
            "items", result.getContent(),
            "page", result.getNumber(),
            "totalPages", result.getTotalPages(),
            "totalItems", result.getTotalElements()
        ));
    }

    @GetMapping("/featured")
    public ApiResponse<List<Article>> featured() {
        List<Article> out = service.featured();
        out.forEach(a -> a.setResolvedImageId(imagery.imageForArticle(a)));
        return ApiResponse.ok(out);
    }
}
