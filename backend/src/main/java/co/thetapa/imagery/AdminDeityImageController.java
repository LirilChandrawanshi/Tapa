package co.thetapa.imagery;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** CMS surface for the deity image sets. */
@RestController
@RequestMapping("/api/v1/admin/deity-images")
public class AdminDeityImageController {

    private final DeityImageService service;

    public AdminDeityImageController(DeityImageService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<DeityImageService.DeityRow>> list() {
        return ApiResponse.ok(service.rows());
    }

    public record SetBody(List<String> imageIds) {
    }

    @PutMapping("/{deity}")
    public ApiResponse<DeityImages> save(@PathVariable String deity,
                                         @RequestBody SetBody body) {
        return ApiResponse.ok(service.save(deity, body.imageIds()));
    }
}
