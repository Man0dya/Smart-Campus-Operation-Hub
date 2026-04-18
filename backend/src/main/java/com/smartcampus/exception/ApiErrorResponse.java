package com.smartcampus.exception;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
    public static ApiErrorResponse of(int status,
                                      String error,
                                      String message,
                                      String path,
                                      List<String> details) {
        return new ApiErrorResponse(Instant.now().toString(), status, error, message, path, details);
    }
}