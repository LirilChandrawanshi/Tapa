package co.thetapa.glossary;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Glossary entries carry no DPB tag and no confidence score, by design.
 */
@Document("glossary_terms")
public class GlossaryTerm {

    public enum Category { MATERIAL, PRACTICE, TIME_CALENDAR, TEXT_TERM }

    public enum Language { SANSKRIT, HINDI }

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;

    private String term;
    private String devanagari;
    private String transliteration;
    /** <= 40 words, enforced in admin */
    private String definition;
    private String definitionHi;

    @Indexed
    private Category category;
    private Language language;

    /** link to the Dharmic Concept article where one exists */
    private String conceptArticleSlug;

    private long lookupCount;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }
    public String getDevanagari() { return devanagari; }
    public void setDevanagari(String devanagari) { this.devanagari = devanagari; }
    public String getTransliteration() { return transliteration; }
    public void setTransliteration(String transliteration) { this.transliteration = transliteration; }
    public String getDefinition() { return definition; }
    public void setDefinition(String definition) { this.definition = definition; }
    public String getDefinitionHi() { return definitionHi; }
    public void setDefinitionHi(String definitionHi) { this.definitionHi = definitionHi; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
    public String getConceptArticleSlug() { return conceptArticleSlug; }
    public void setConceptArticleSlug(String conceptArticleSlug) { this.conceptArticleSlug = conceptArticleSlug; }
    public long getLookupCount() { return lookupCount; }
    public void setLookupCount(long lookupCount) { this.lookupCount = lookupCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
