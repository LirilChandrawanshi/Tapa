package co.thetapa.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.registerCustomCache("flags", Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(60)).maximumSize(10).build());
        manager.registerCustomCache("panchang", Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(24)).maximumSize(2_000).build());
        manager.registerCustomCache("home", Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(5)).maximumSize(10).build());
        manager.registerCustomCache("taxonomy", Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(1)).maximumSize(5).build());
        return manager;
    }
}
