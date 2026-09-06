package co.thetapa.flags;

import jakarta.annotation.PostConstruct;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FeatureFlagService {

    public static final String KITS_LAUNCHED = "kits_launched";
    public static final String PUROHIT_TAB_VISIBLE = "purohit_tab_visible";

    private final FeatureFlagRepository repository;
    private final org.springframework.context.ApplicationEventPublisher events;

    public FeatureFlagService(FeatureFlagRepository repository,
                              org.springframework.context.ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    @PostConstruct
    void bootstrapDefaults() {
        ensure(KITS_LAUNCHED, false);
        ensure(PUROHIT_TAB_VISIBLE, false);
    }

    private void ensure(String key, boolean defaultValue) {
        if (repository.findByKey(key).isEmpty()) {
            repository.save(new FeatureFlag(key, defaultValue));
        }
    }

    @Cacheable("flags")
    public Map<String, Boolean> all() {
        return repository.findAll().stream()
            .collect(Collectors.toMap(FeatureFlag::getKey, FeatureFlag::isValue));
    }

    @CacheEvict(value = "flags", allEntries = true)
    public FeatureFlag set(String key, boolean value, String updatedBy) {
        FeatureFlag flag = repository.findByKey(key).orElseGet(() -> new FeatureFlag(key, value));
        flag.setValue(value);
        flag.setUpdatedBy(updatedBy);
        FeatureFlag saved = repository.save(flag);
        // marketing flips must reach the site immediately, not on cache expiry
        events.publishEvent(new FlagChangedEvent(key, value));
        return saved;
    }

    public record FlagChangedEvent(String key, boolean value) {
    }
}
