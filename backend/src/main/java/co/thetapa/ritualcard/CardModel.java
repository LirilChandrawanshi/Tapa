package co.thetapa.ritualcard;

import java.util.List;

/**
 * Fully-resolved view model for the ritual card template. Everything the
 * template renders is here (except the QR data-URI, which is derived
 * deterministically from {@link #guideUrl} at render time so the variant hash
 * stays independent of PNG encoder details).
 *
 * <p>Conditional blocks are {@code null} when absent: {@code samagri},
 * {@code mantra}, {@code fasting}. Header, panchang strip, vidhi and footer
 * are always present.</p>
 */
public record CardModel(
    String slug,
    String festivalName,
    String headerSubLine,
    List<PanchangField> panchang,
    SamagriSection samagri,
    List<StepRow> steps,
    MantraCard mantra,
    List<FastingLine> fasting,
    String guideUrl,
    String sourceLine
) {

    /** One cell of the dark panchang strip. {@code highlight} renders the value rose. */
    public record PanchangField(String label, String value, String sub, boolean highlight) {
    }

    /** {@code twoColumn} = render groups side by side; single-column cards have one unnamed group. */
    public record SamagriSection(boolean twoColumn, List<SamagriGroup> groups) {
    }

    public record SamagriGroup(String heading, List<String> items) {
    }

    /**
     * One vidhi line. {@code subHeader} (nullable) is an italic date sub-header
     * rendered above this step for multi-day vrats. {@code last} = rose circle.
     */
    public record StepRow(int number, String title, String subHeader, boolean last) {
    }

    public record MantraCard(String devanagari, String transliteration, String countLine) {
    }

    public record FastingLine(String name, String text) {
    }
}
