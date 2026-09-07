package co.thetapa.media;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/**
 * Raises the servlet multipart limits above Spring Boot's 1MB default —
 * audio guides are several MB of MP3. Kept beside the only multipart
 * consumer; Boot's auto-config backs off when this bean exists.
 */
@Configuration
public class MediaUploadConfig {

    @Bean
    MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(30));
        factory.setMaxRequestSize(DataSize.ofMegabytes(32));
        return factory.createMultipartConfig();
    }
}
