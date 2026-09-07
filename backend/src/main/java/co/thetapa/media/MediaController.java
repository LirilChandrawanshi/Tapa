package co.thetapa.media;

import co.thetapa.common.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.Map;

/**
 * Media endpoints (audit G39/G6/G20).
 *
 * <p>Upload/delete sit under {@code /api/v1/admin/**} (EDITOR/ADMIN via
 * SecurityConfig); serving is public. Asset ids are immutable — bytes under an
 * id never change, so responses carry a one-year immutable Cache-Control.</p>
 *
 * <p>Range/seek support: the handler returns a file-backed {@link Resource};
 * Spring MVC's message-converter path natively answers {@code Range} requests
 * with {@code 206 Partial Content} (and {@code 416} for bad ranges), which the
 * audio player needs for seeking.</p>
 */
@RestController
public class MediaController {

    private final MediaService service;
    private final MediaStorage storage;

    public MediaController(MediaService service, MediaStorage storage) {
        this.service = service;
        this.storage = storage;
    }

    /** Multipart upload; field name {@code file}. Images may return a derived {@code waAssetId}. */
    @PostMapping("/api/v1/admin/media")
    public ApiResponse<MediaService.UploadResult> upload(@RequestParam("file") MultipartFile file) {
        try {
            return ApiResponse.ok(
                service.upload(file.getOriginalFilename(), file.getContentType(), file.getBytes()));
        } catch (IOException e) {
            throw new UncheckedIOException("could not read upload", e);
        }
    }

    /** Public byte stream — correct Content-Type, immutable caching, Range-capable. */
    @GetMapping("/api/v1/media/{id}")
    public ResponseEntity<Resource> serve(@PathVariable String id) {
        MediaAsset asset = service.get(id);
        Resource resource = storage.resource(asset.getStorageKey());
        if (!resource.exists()) {
            throw new co.thetapa.common.NotFoundException("media", id);
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(asset.getMime()))
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
            .header("Accept-Ranges", "bytes")
            .header("Content-Disposition", "inline; filename=\"" + asset.getFilename() + "\"")
            .body(resource);
    }

    @DeleteMapping("/api/v1/admin/media/{id}")
    public ApiResponse<Map<String, Boolean>> delete(@PathVariable String id) {
        service.delete(id);
        return ApiResponse.ok(Map.of("deleted", true));
    }
}
