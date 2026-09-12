package co.thetapa.feed;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/feed")
public class FeedAdminController {

    private final FeedService service;

    public FeedAdminController(FeedService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<FeedItem>> list() {
        return ApiResponse.ok(service.allItems());
    }

    @PostMapping
    public ApiResponse<FeedItem> create(@RequestBody FeedItem item) {
        return ApiResponse.ok(service.create(item));
    }

    @PutMapping("/{id}")
    public ApiResponse<FeedItem> update(@PathVariable String id, @RequestBody FeedItem item) {
        return ApiResponse.ok(service.update(id, item));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.ok(null);
    }
}
