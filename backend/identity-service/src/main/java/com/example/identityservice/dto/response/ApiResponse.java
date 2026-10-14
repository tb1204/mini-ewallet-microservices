package com.example.identityservice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

/**
 * Standardized API Response wrapper for all REST endpoints across microservices.
 *
 * @param <T> Payload data type
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    private int code = 1000;

    private String message;
    private T data;

    @Builder.Default
    private Instant timestamp = Instant.now();

    /** Compatibility getter for result */
    public T getResult() {
        return data;
    }

    /** Build successful response with data. */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message("Thành công")
                .data(data)
                .timestamp(Instant.now())
                .build();
    }

    /** Build successful response with custom message and data. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message(message)
                .data(data)
                .timestamp(Instant.now())
                .build();
    }

    /** Build error response with error code and error message. */
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }
}

