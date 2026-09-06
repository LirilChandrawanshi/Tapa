package co.thetapa.common;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String resource, String key) {
        super(resource + " not found: " + key);
    }
}
