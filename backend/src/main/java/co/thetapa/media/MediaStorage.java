package co.thetapa.media;

import org.springframework.core.io.Resource;

/**
 * Byte-storage seam for media assets. Phase 1 ships {@link LocalDiskStorage};
 * an S3 (or R2/GCS) backend later is a drop-in replacement:
 *
 * <ul>
 *   <li>{@code store} → {@code PutObject(bucket, key, data)}</li>
 *   <li>{@code resource} → a ranged-read capable {@code Resource}
 *       (Spring Cloud AWS's {@code S3Resource}, or a presigned-URL redirect
 *       handled one level up in the controller)</li>
 *   <li>{@code delete} → {@code DeleteObject}</li>
 * </ul>
 *
 * Keys are relative, {@code /}-separated, and never contain {@code ..} — the
 * service generates them ({@code uploads/<assetId>.<ext>}), callers never do.
 * The returned {@link Resource} must support {@code contentLength()} and
 * random access reads so the HTTP layer can serve Range requests (audio
 * seeking); prefer file/S3-backed resources over bare InputStream wrappers.
 */
public interface MediaStorage {

    /** Persist {@code data} under {@code key}, overwriting any previous object. */
    void store(String key, byte[] data);

    /** Handle for reading the object; may point at a missing object — check {@code exists()}. */
    Resource resource(String key);

    /** Remove the object; missing objects are a no-op. */
    void delete(String key);
}
