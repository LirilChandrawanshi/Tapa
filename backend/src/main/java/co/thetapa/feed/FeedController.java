package co.thetapa.feed;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feed")
public class FeedController {

    private final FeedService service;

    public FeedController(FeedService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<FeedCard>> feed() {
        return ApiResponse.ok(service.publicFeed());
    }
}
