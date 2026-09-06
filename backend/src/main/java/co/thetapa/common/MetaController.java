package co.thetapa.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MetaController {

    @GetMapping("/meta")
    public ApiResponse<Map<String, String>> meta() {
        return ApiResponse.ok(Map.of(
            "name", "tapa-backend",
            "phase", "1"
        ));
    }
}
