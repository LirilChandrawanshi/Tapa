package co.thetapa.panchang;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/**
 * The six stable panchang endpoints. The PRD locks this contract: even if the
 * underlying provider changes, these shapes must not.
 */
@RestController
@RequestMapping("/api/v1/panchang")
public class PanchangController {

    private final PanchangService service;

    public PanchangController(PanchangService service) {
        this.service = service;
    }

    @GetMapping("/today")
    public ApiResponse<PanchangService.DayPayload> today(@RequestParam(required = false) String city) {
        return ApiResponse.ok(service.today(city));
    }

    @GetMapping("/date/{date}")
    public ApiResponse<PanchangService.DayPayload> date(@PathVariable LocalDate date,
                                                        @RequestParam(required = false) String city) {
        return ApiResponse.ok(service.day(date, city));
    }

    @GetMapping("/festivals")
    public ApiResponse<List<PanchangService.UpcomingObservance>> festivals() {
        return ApiResponse.ok(service.byType(Observance.Type.FESTIVAL));
    }

    @GetMapping("/festival/{slug}")
    public ApiResponse<Map<String, Object>> festival(@PathVariable String slug) {
        return ApiResponse.ok(service.festival(slug));
    }

    @GetMapping("/upcoming")
    public ApiResponse<List<PanchangService.UpcomingObservance>> upcoming(
        @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.ok(service.upcoming(limit));
    }

    @GetMapping("/calendar/{month}")
    public ApiResponse<List<PanchangService.UpcomingObservance>> calendar(@PathVariable String month) {
        return ApiResponse.ok(service.calendar(YearMonth.parse(month)));
    }

    @GetMapping("/ekadashi")
    public ApiResponse<List<PanchangService.UpcomingObservance>> ekadashi() {
        return ApiResponse.ok(service.ekadashi());
    }
}
