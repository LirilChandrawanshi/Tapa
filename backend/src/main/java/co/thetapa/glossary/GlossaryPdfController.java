package co.thetapa.glossary;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /api/v1/glossary.pdf — the full glossary as one printable PDF (#118).
 * Lives outside the /api/v1/glossary class mapping because ".pdf" is part of
 * the final path segment, not a sub-resource.
 */
@RestController
public class GlossaryPdfController {

    private final GlossaryPdfService service;

    public GlossaryPdfController(GlossaryPdfService service) {
        this.service = service;
    }

    @GetMapping(value = "/api/v1/glossary.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> download() {
        byte[] pdf = service.render(service.fingerprint());
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"tapa-glossary.pdf\"")
            .body(pdf);
    }
}
