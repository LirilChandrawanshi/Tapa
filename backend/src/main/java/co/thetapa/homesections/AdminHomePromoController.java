package co.thetapa.homesections;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** CMS surface for editor-placed homepage bands. */
@RestController
@RequestMapping("/api/v1/admin/home-promos")
public class AdminHomePromoController {

    private final HomePromoService service;

    public AdminHomePromoController(HomePromoService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<HomePromo>> list() {
        return ApiResponse.ok(service.all());
    }

    @PostMapping
    public ApiResponse<HomePromo> create(@RequestBody HomePromo body) {
        return ApiResponse.ok(service.create(body));
    }

    @PutMapping("/{id}")
    public ApiResponse<HomePromo> update(@PathVariable String id, @RequestBody HomePromo body) {
        return ApiResponse.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.ok(Map.of("deleted", true));
    }
}
