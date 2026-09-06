# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

# Runtime — Playwright base image ships Chromium + deps for ritual-card PDFs
FROM mcr.microsoft.com/playwright/java:v1.49.0-noble
WORKDIR /app
COPY --from=build /app/target/tapa-backend-*.jar app.jar
ENV TAPA_MEDIA_ROOT=/data/media
VOLUME /data/media
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
