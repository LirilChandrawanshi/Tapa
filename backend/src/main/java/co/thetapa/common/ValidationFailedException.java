package co.thetapa.common;

import java.util.List;

public class ValidationFailedException extends RuntimeException {

    private final List<String> errors;

    public ValidationFailedException(List<String> errors) {
        super(String.join("; ", errors));
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
