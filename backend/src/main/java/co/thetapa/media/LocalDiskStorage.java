package co.thetapa.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Disk-backed {@link MediaStorage} rooted at {@code tapa.media.root}
 * (default {@code ../media}, shared with the ritual-card PDF cache which
 * uses {@code cards/}; uploads live under {@code uploads/}).
 * {@link FileSystemResource} supports random access, so Spring MVC can
 * serve HTTP Range requests directly from it.
 */
@Component
public class LocalDiskStorage implements MediaStorage {

    private final Path root;

    public LocalDiskStorage(@Value("${tapa.media.root:../media}") String mediaRoot) {
        this.root = Path.of(mediaRoot).toAbsolutePath().normalize();
    }

    @Override
    public void store(String key, byte[] data) {
        Path path = resolve(key);
        try {
            Files.createDirectories(path.getParent());
            Files.write(path, data);
        } catch (IOException e) {
            throw new UncheckedIOException("failed to store media object " + key, e);
        }
    }

    @Override
    public Resource resource(String key) {
        return new FileSystemResource(resolve(key));
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            throw new UncheckedIOException("failed to delete media object " + key, e);
        }
    }

    /** Defense in depth: keys are service-generated, but never allow escaping the root. */
    private Path resolve(String key) {
        Path path = root.resolve(key).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("invalid storage key");
        }
        return path;
    }
}
