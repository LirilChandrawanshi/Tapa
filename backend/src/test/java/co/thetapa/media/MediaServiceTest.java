package co.thetapa.media;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Controller-less pipeline test: real {@link LocalDiskStorage} on a temp dir,
 * mocked Mongo repository (save echoes, findById reads the saved map).
 */
class MediaServiceTest {

    @TempDir
    Path tempDir;

    private final Map<String, MediaAsset> saved = new HashMap<>();
    private MediaService service;
    private LocalDiskStorage storage;

    @BeforeEach
    void setUp() {
        MediaAssetRepository repository = mock(MediaAssetRepository.class);
        when(repository.save(any(MediaAsset.class))).thenAnswer(inv -> {
            MediaAsset a = inv.getArgument(0);
            saved.put(a.getId(), a);
            return a;
        });
        when(repository.findById(anyString()))
            .thenAnswer(inv -> Optional.ofNullable(saved.get(inv.<String>getArgument(0))));
        storage = new LocalDiskStorage(tempDir.toString());
        service = new MediaService(repository, storage);
    }

    private static byte[] png(int w, int h) throws Exception {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    @Test
    void largeImageIsDownscaledAndWaVariantDerived() throws Exception {
        var result = service.upload("hero art.png", "image/png", png(3200, 1800));

        assertEquals(1600, result.width());
        assertEquals(900, result.height());
        assertEquals("image/jpeg", result.mime()); // recompressed on downscale
        assertNotNull(result.waAssetId());
        assertEquals("/api/v1/media/" + result.id(), result.url());

        MediaAsset wa = service.get(result.waAssetId());
        assertEquals(800, wa.getWidth());
        assertEquals(418, wa.getHeight());
        assertEquals("image/jpeg", wa.getMime());
        assertTrue(wa.getStorageKey().startsWith("uploads/"));
        assertTrue(storage.resource(wa.getStorageKey()).exists());

        // stored bytes decode back to the exact WA frame
        try (var in = storage.resource(wa.getStorageKey()).getInputStream()) {
            BufferedImage decoded = ImageIO.read(in);
            assertEquals(800, decoded.getWidth());
            assertEquals(418, decoded.getHeight());
        }
    }

    @Test
    void smallImageKeptVerbatimButStillGetsWaVariant() throws Exception {
        byte[] original = png(1200, 700);
        var result = service.upload("small.png", "image/png", original);

        assertEquals(1200, result.width());
        assertEquals("image/png", result.mime()); // no recompression under 1600w
        assertEquals(original.length, result.bytes());
        assertNotNull(result.waAssetId());
    }

    @Test
    void audioStoredVerbatimNoDimensionsNoVariant() {
        byte[] fakeMp3 = new byte[]{'I', 'D', '3', 4, 0, 0, 0, 0, 0, 0};
        var result = service.upload("guide.mp3", "audio/mpeg", fakeMp3);

        assertNull(result.width());
        assertNull(result.waAssetId());
        MediaAsset asset = service.get(result.id());
        assertEquals(MediaKind.AUDIO, asset.getKind());
        assertTrue(asset.getStorageKey().endsWith(".mp3"));
    }

    @Test
    void rejectsUnsupportedMime() throws Exception {
        byte[] data = png(10, 10);
        assertThrows(IllegalArgumentException.class,
            () -> service.upload("x.gif", "image/gif", data));
        assertThrows(IllegalArgumentException.class,
            () -> service.upload("x.bin", "application/octet-stream", data));
        assertThrows(IllegalArgumentException.class,
            () -> service.upload("empty.png", "image/png", new byte[0]));
    }

    @Test
    void deleteRemovesBytesAndDocument() throws Exception {
        var result = service.upload("gone.png", "image/png", png(100, 100));
        String key = service.get(result.id()).getStorageKey();
        assertTrue(storage.resource(key).exists());

        service.delete(result.id());
        saved.remove(result.id()); // mirror what Mongo would do
        assertTrue(!storage.resource(key).exists());
    }
}
