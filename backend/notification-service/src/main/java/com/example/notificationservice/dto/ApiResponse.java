package com.example.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    @Builder.Default
    private int code = 1000;

    private String message;
    private T result;

    @Builder.Default
    private Instant timestamp = Instant.now();

    public static <T> ApiResponse<T> success(String message, T result) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message(message)
                .result(result)
                .timestamp(Instant.now())
                .build();
    }
}

