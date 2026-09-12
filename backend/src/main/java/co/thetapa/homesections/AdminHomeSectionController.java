package co.thetapa.homesections;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** CMS surface for the editable homepage bands. */
@RestController
@RequestMapping("/api/v1/admin/home-sections")
public class AdminHomeSectionController {

    private final HomeSectionService service;

    public AdminHomeSectionController(HomeSectionService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<HomeSection>> list() {
        return ApiResponse.ok(service.all());
    }

    @PutMapping("/{key}")
    public ApiResponse<HomeSection> save(@PathVariable String key, @RequestBody HomeSection body) {
        return ApiResponse.ok(service.save(key, body));
    }

    /** Puts one band back to the copy it shipped with. */
    @PostMapping("/{key}/reset")
    public ApiResponse<HomeSection> reset(@PathVariable String key) {
        return ApiResponse.ok(service.reset(key));
    }
}
