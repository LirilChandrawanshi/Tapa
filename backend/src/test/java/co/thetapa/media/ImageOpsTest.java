package co.thetapa.media;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** WA-variant crop math (800×418 ≈ 1.914:1) + resize geometry. */
class ImageOpsTest {

    @Test
    void wideSourceCropsSidesFullHeight() {
        // 4000×1000 is far wider than 1.914:1 → keep height, trim width
        var r = ImageOps.centerCrop(4000, 1000, 800, 418);
        assertEquals(1000, r.height());
        assertEquals(1914, r.width()); // 1000 * 800/418 ≈ 1913.9 → 1914
        assertEquals((4000 - 1914) / 2, r.x());
        assertEquals(0, r.y());
    }

    @Test
    void tallSourceCropsTopAndBottomFullWidth() {
        // 1000×2000 portrait → keep width, trim height
        var r = ImageOps.centerCrop(1000, 2000, 800, 418);
        assertEquals(1000, r.width());
        assertEquals(523, r.height()); // 1000 * 418/800 = 522.5 → 523
        assertEquals(0, r.x());
        assertEquals((2000 - 523) / 2, r.y());
    }

    @Test
    void exactAspectCropsNothing() {
        var r = ImageOps.centerCrop(1600, 836, 800, 418);
        assertEquals(new ImageOps.CropRect(0, 0, 1600, 836), r);
    }

    @Test
    void cropNeverExceedsSourceBounds() {
        // sweep of awkward sizes incl. smaller-than-target sources
        int[][] sizes = {{1, 1}, {799, 417}, {801, 419}, {1601, 3}, {3, 1601}, {123, 457}};
        for (int[] s : sizes) {
            var r = ImageOps.centerCrop(s[0], s[1], 800, 418);
            assertTrue(r.x() >= 0 && r.y() >= 0, "origin in bounds for " + s[0] + "x" + s[1]);
            assertTrue(r.x() + r.width() <= s[0], "width in bounds for " + s[0] + "x" + s[1]);
            assertTrue(r.y() + r.height() <= s[1], "height in bounds for " + s[0] + "x" + s[1]);
            // aspect of the crop tracks the target within rounding
            double aspect = (double) r.width() / r.height();
            double target = 800.0 / 418.0;
            assertTrue(Math.abs(aspect - target) < 0.5 || r.width() == s[0] || r.height() == s[1],
                "aspect sane for " + s[0] + "x" + s[1]);
        }
    }

    @Test
    void scaledHeightPreservesAspect() {
        assertEquals(1200, ImageOps.scaledHeight(3200, 2400, 1600));
        assertEquals(900, ImageOps.scaledHeight(3200, 1800, 1600));
        assertEquals(1, ImageOps.scaledHeight(4000, 1, 1600)); // never 0
    }

    @Test
    void rejectsNonPositiveDimensions() {
        assertThrows(IllegalArgumentException.class, () -> ImageOps.centerCrop(0, 100, 800, 418));
        assertThrows(IllegalArgumentException.class, () -> ImageOps.scaledHeight(100, 0, 1600));
    }

    @Test
    void coverCropProducesExactTargetPixels() throws Exception {
        BufferedImage src = new BufferedImage(2000, 1200, BufferedImage.TYPE_INT_RGB);
        BufferedImage wa = ImageOps.coverCrop(src, 800, 418);
        assertEquals(800, wa.getWidth());
        assertEquals(418, wa.getHeight());

        byte[] jpeg = ImageOps.toJpeg(wa, 0.85f);
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(jpeg));
        assertEquals(800, decoded.getWidth());
        assertEquals(418, decoded.getHeight());
    }
}
