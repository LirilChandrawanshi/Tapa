package co.thetapa.ritualcard;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Truth-table test: builds a CardModel per fixture and renders the Thymeleaf
 * template (HTML only — no browser, no Mongo), asserting block presence and
 * absence via the template's stable {@code data-block} markers.
 */
class CardTruthTableTest {

    private static SpringTemplateEngine engine;

    record Row(String id, String fixture, String description,
               List<String> present, List<String> absent,
               List<String> mustContain, List<String> mustNotContain) {
    }

    @BeforeAll
    static void createEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
    }

    static Stream<Row> rows() throws IOException {
        try (InputStream in = CardTruthTableTest.class.getResourceAsStream("/ritualcard/truthtable.json")) {
            ObjectMapper mapper = new ObjectMapper();
            return List.of(mapper.readValue(in, Row[].class)).stream();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("rows")
    void blockTruthTable(Row row) {
        CardFixtures.Fixture fixture = CardFixtures.byName(row.fixture());
        CardModel model = CardModelBuilder.build(fixture.article(), fixture.observance(), fixture.day());
        String html = render(model);

        for (String block : row.present()) {
            assertTrue(html.contains("data-block=\"" + block + "\""),
                row.id() + ": expected block '" + block + "' to be present");
        }
        for (String block : row.absent()) {
            assertFalse(html.contains("data-block=\"" + block + "\""),
                row.id() + ": expected block '" + block + "' to be absent");
        }
        for (String s : row.mustContain()) {
            assertTrue(html.contains(s), row.id() + ": expected content: " + s);
        }
        for (String s : row.mustNotContain()) {
            assertFalse(html.contains(s), row.id() + ": unexpected content: " + s);
        }

        // structural invariants: <=8 steps, exactly one rose (last) step circle
        assertTrue(model.steps().size() <= 8, row.id() + ": more than 8 vidhi steps rendered");
        assertEquals(1, countOccurrences(html, "class=\"step last\""),
            row.id() + ": exactly one last (rose) step expected");
    }

    private static String render(CardModel model) {
        Context context = new Context(Locale.ENGLISH);
        context.setVariable("card", model);
        context.setVariable("qr", QrCodes.dataUri(model.guideUrl(), 128));
        return engine.process("ritualcard/card", context);
    }

    private static int countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) >= 0) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}
