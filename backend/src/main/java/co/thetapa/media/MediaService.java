package co.thetapa.media;

import co.thetapa.common.NotFoundException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Upload pipeline (audit G39): validate → decode → normalize → store.
 *
 * <ul>
 *   <li>Images wider than {@value #MAX_WIDTH}px are downscaled to
 *       {@value #MAX_WIDTH}w JPEG q{@code 85} — hero art never ships larger
 *       than the widest layout slot.</li>
 *   <li>Every decodable image also yields an {@value #WA_WIDTH}×{@value #WA_HEIGHT}
 *       center-crop variant (WhatsApp/OG card, 1.91:1) stored as its own asset
 *       and returned as {@code waAssetId} so the editor can wire
 *       {@code waImageId} in one step.</li>
 *   <li>WebP is accepted but stored verbatim (stock ImageIO cannot decode it;
 *       we prefer zero native deps): no dimensions, no WA variant — the editor
 *       can upload a JPEG/PNG WA override manually.</li>
 * </ul>
 */
@Service
public class MediaService {

    static final int MAX_WIDTH = 1600;
    static final int WA_WIDTH = 800;
    static final int WA_HEIGHT = 418;
    static final float JPEG_QUALITY = 0.85f;

    private static final Set<String> IMAGE_MIMES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> AUDIO_MIMES = Set.of("audio/mpeg");
    private static final Map<String, String> EXTENSIONS = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png",
        "image/webp", "webp",
        "audio/mpeg", "mp3",
        "application/pdf", "pdf");

    public record UploadResult(String id, String waAssetId, Integer width, Integer height,
                               String mime, long bytes, String url) {
    }

    private final MediaAssetRepository repository;
    private final MediaStorage storage;

    public MediaService(MediaAssetRepository repository, MediaStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    public UploadResult upload(String originalFilename, String contentType, byte[] data) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("Empty upload.");
        }
        String mime = normalizeMime(contentType);
        if (!IMAGE_MIMES.contains(mime) && !AUDIO_MIMES.contains(mime)) {
            throw new IllegalArgumentException(
                "Unsupported type '" + contentType + "' — allowed: JPEG, PNG, WebP images or MP3 audio.");
        }
        String filename = sanitizeFilename(originalFilename);

        if (AUDIO_MIMES.contains(mime)) {
            MediaAsset audio = persist(filename, mime, MediaKind.AUDIO, data, null, null);
            return result(audio, null);
        }

        BufferedImage image = decode(data);
        if (image == null) {
            // undecodable with stock ImageIO (webp) — store verbatim, no variant
            MediaAsset asset = persist(filename, mime, MediaKind.IMAGE, data, null, null);
            return result(asset, null);
        }

        byte[] mainBytes = data;
        String mainMime = mime;
        int width = image.getWidth();
        int height = image.getHeight();
        if (width > MAX_WIDTH) {
            BufferedImage resized = ImageOps.resizeToWidth(image, MAX_WIDTH);
            mainBytes = ImageOps.toJpeg(resized, JPEG_QUALITY);
            mainMime = "image/jpeg";
            width = resized.getWidth();
            height = resized.getHeight();
            filename = stripExtension(filename) + ".jpg"; // bytes are JPEG now
        }
        MediaAsset main = persist(filename, mainMime, MediaKind.IMAGE, mainBytes, width, height);

        byte[] waBytes = ImageOps.toJpeg(ImageOps.coverCrop(image, WA_WIDTH, WA_HEIGHT), JPEG_QUALITY);
        MediaAsset wa = persist("wa-" + stripExtension(filename) + ".jpg", "image/jpeg",
            MediaKind.IMAGE, waBytes, WA_WIDTH, WA_HEIGHT);

        return result(main, wa.getId());
    }

    public MediaAsset get(String id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("media", id));
    }

    public void delete(String id) {
        MediaAsset asset = get(id);
        storage.delete(asset.getStorageKey());
        repository.deleteById(id);
    }

    // ---- internals ----------------------------------------------------------

    private MediaAsset persist(String filename, String mime, MediaKind kind,
                               byte[] data, Integer width, Integer height) {
        MediaAsset asset = new MediaAsset();
        asset.setId(UUID.randomUUID().toString().replace("-", ""));
        asset.setFilename(filename);
        asset.setMime(mime);
        asset.setBytes(data.length);
        asset.setKind(kind);
        asset.setWidth(width);
        asset.setHeight(height);
        asset.setStorageKey("uploads/" + asset.getId() + "." + EXTENSIONS.get(mime));
        storage.store(asset.getStorageKey(), data);
        return repository.save(asset);
    }

    private static UploadResult result(MediaAsset asset, String waAssetId) {
        return new UploadResult(asset.getId(), waAssetId, asset.getWidth(), asset.getHeight(),
            asset.getMime(), asset.getBytes(), "/api/v1/media/" + asset.getId());
    }

    private static BufferedImage decode(byte[] data) {
        try {
            return ImageIO.read(new ByteArrayInputStream(data));
        } catch (IOException e) {
            return null;
        }
    }

    private static String normalizeMime(String contentType) {
        if (contentType == null) return "";
        String mime = contentType.toLowerCase().split(";")[0].trim();
        if (mime.equals("audio/mp3")) return "audio/mpeg";
        if (mime.equals("image/jpg")) return "image/jpeg";
        return mime;
    }

    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) return "upload";
        String base = name.substring(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private static String stripExtension(String name) {
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }
}
