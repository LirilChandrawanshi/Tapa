package co.thetapa.content;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Enforces the DPB editorial rules (PRD non-negotiables) at the review→publish
 * transition. Drafts may be incomplete; nothing publishes without passing.
 */
@Component
public class DpbValidator {

    public List<String> validate(Article article) {
        List<String> errors = new ArrayList<>();

        Dpb dpb = article.getDpb();
        if (dpb == null || dpb.classification() == null) {
            errors.add("Article must carry a DPB classification before publishing.");
            return errors;
        }
        validateDpb(dpb, "article", errors);

        // per-step tags inside vidhi blocks
        var en = article.getLang() == null ? null : article.getLang().get("en");
        if (en == null || en.title() == null || en.title().isBlank()) {
            errors.add("English content with a title is required.");
        }
        if (en != null && en.blocks() != null) {
            en.blocks().stream()
                .filter(b -> b.type() == Block.BlockType.VIDHI && b.steps() != null)
                .flatMap(b -> b.steps().stream())
                .filter(s -> s.dpb() != null)
                .forEach(s -> validateDpb(s.dpb(), "vidhi step " + s.number(), errors));

            en.blocks().stream()
                .filter(b -> b.type() == Block.BlockType.SAMAGRI && b.samagri() != null)
                .filter(b -> b.samagri().size() > 8)
                .forEach(b -> errors.add("Samagri checklist may hold at most 8 items (PRD)."));
        }

        if (article.getCircleTeaser() != null && article.getCircleTeaser().length() > 100) {
            errors.add("circle_teaser must be at most 100 characters (WhatsApp T2 spec).");
        }

        return errors;
    }

    private void validateDpb(Dpb dpb, String where, List<String> errors) {
        switch (dpb.classification()) {
            case DHARMA -> {
                if (dpb.confidenceScore() == null || dpb.confidenceScore() < 3 || dpb.confidenceScore() > 5) {
                    errors.add("DHARMA (" + where + ") requires a confidence score of 3–5; a score below 3 can never be DHARMA.");
                }
                if (isBlank(dpb.sourceName())) {
                    errors.add("DHARMA (" + where + ") requires a named scripture source.");
                }
            }
            case PRATHA -> {
                if (dpb.confidenceScore() == null || dpb.confidenceScore() > 2 || dpb.confidenceScore() < 1) {
                    errors.add("PRATHA (" + where + ") requires a confidence score of 1–2.");
                }
                if (isBlank(dpb.prathaScope())) {
                    errors.add("PRATHA (" + where + ") requires a regional scope.");
                }
            }
            case BHRANTI -> {
                if (dpb.confidenceScore() != null) {
                    errors.add("BHRANTI (" + where + ") carries no confidence score.");
                }
            }
            case MIXED -> {
                if (dpb.confidenceScore() == null) {
                    errors.add("MIXED (" + where + ") requires a confidence score for its Dharma core.");
                }
                if (isBlank(dpb.sourceName())) {
                    errors.add("MIXED (" + where + ") requires a named scripture source for its Dharma core.");
                }
            }
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
