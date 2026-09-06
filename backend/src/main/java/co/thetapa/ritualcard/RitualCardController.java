package co.thetapa.ritualcard;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;

/**
 * Public download endpoint for the print-ready ritual card.
 * GET /api/v1/cards/{articleSlug}.pdf — lazily regenerates when the card
 * content (article/observance/panchang) has changed, then streams the PDF.
 * 404 (via {@link co.thetapa.common.NotFoundException}) when the article is
 * missing or unpublished.
 */
@RestController
@RequestMapping("/api/v1/cards")
public class RitualCardController {

    private final RitualCardService service;

    public RitualCardController(RitualCardService service) {
        this.service = service;
    }

    @GetMapping(value = "/{articleSlug}.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<FileSystemResource> download(@PathVariable String articleSlug) {
        Path pdf = service.ensureFresh(articleSlug);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + articleSlug + ".pdf\"")
            .body(new FileSystemResource(pdf));
    }
}
