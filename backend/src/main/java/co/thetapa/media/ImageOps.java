package co.thetapa.media;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Pure-Java image processing (ImageIO + Graphics2D — no native/extra deps).
 * The geometry helpers are static and side-effect free so the crop/resize
 * math is unit-testable without touching pixels.
 */
final class ImageOps {

    private ImageOps() {
    }

    /** Source-space crop rectangle. */
    record CropRect(int x, int y, int width, int height) {
    }

    /**
     * Largest centered rectangle inside {@code srcW×srcH} with the aspect
     * ratio of {@code targetW:targetH} ("cover" crop). Scaling that rect to
     * the target size yields a center-crop with no letterboxing.
     */
    static CropRect centerCrop(int srcW, int srcH, int targetW, int targetH) {
        if (srcW <= 0 || srcH <= 0 || targetW <= 0 || targetH <= 0) {
            throw new IllegalArgumentException("dimensions must be positive");
        }
        int cropW;
        int cropH;
        // compare src aspect (srcW/srcH) with target aspect (targetW/targetH) in integers
        if ((long) srcW * targetH >= (long) srcH * targetW) {
            // source is wider than the target aspect → full height, trim the sides
            cropH = srcH;
            cropW = (int) Math.min(srcW, Math.round((double) srcH * targetW / targetH));
        } else {
            // source is taller → full width, trim top/bottom
            cropW = srcW;
            cropH = (int) Math.min(srcH, Math.round((double) srcW * targetH / targetW));
        }
        return new CropRect((srcW - cropW) / 2, (srcH - cropH) / 2, cropW, cropH);
    }

    /** Height after scaling {@code w×h} to {@code targetW} preserving aspect (min 1px). */
    static int scaledHeight(int w, int h, int targetW) {
        if (w <= 0 || h <= 0 || targetW <= 0) {
            throw new IllegalArgumentException("dimensions must be positive");
        }
        return Math.max(1, (int) Math.round((double) h * targetW / w));
    }

    /** Downscale to {@code targetW} wide, preserving aspect ratio. */
    static BufferedImage resizeToWidth(BufferedImage src, int targetW) {
        return scale(src, targetW, scaledHeight(src.getWidth(), src.getHeight(), targetW));
    }

    /** Center-crop to the target aspect, then scale to exactly {@code targetW×targetH}. */
    static BufferedImage coverCrop(BufferedImage src, int targetW, int targetH) {
        CropRect r = centerCrop(src.getWidth(), src.getHeight(), targetW, targetH);
        BufferedImage cropped = src.getSubimage(r.x(), r.y(), r.width(), r.height());
        return scale(cropped, targetW, targetH);
    }

    /**
     * JPEG-encode at the given quality (0..1). Alpha is flattened onto white —
     * JPEG has no transparency, and hero art sits on light card backgrounds.
     */
    static byte[] toJpeg(BufferedImage img, float quality) {
        BufferedImage opaque;
        if (img.getType() == BufferedImage.TYPE_INT_RGB) {
            opaque = img;
        } else {
            opaque = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = opaque.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, img.getWidth(), img.getHeight());
            g.drawImage(img, 0, 0, null);
            g.dispose();
        }
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(opaque, null, null), param);
        } catch (IOException e) {
            throw new UncheckedIOException("jpeg encoding failed", e);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private static BufferedImage scale(BufferedImage src, int w, int h) {
        BufferedImage dst = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, w, h);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return dst;
    }
}
