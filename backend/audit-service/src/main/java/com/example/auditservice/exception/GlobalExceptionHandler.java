package com.example.auditservice.exception;

import com.example.auditservice.constants.ErrorCode;
import com.example.auditservice.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("AppException: {} - {}", ex.getErrorCode().getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(
                ApiResponse.<Void>builder()
                        .code(ex.getErrorCode().getCode())
                        .message(ex.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("AccessDeniedException: {}", ex.getMessage());
        return ResponseEntity.status(ErrorCode.FORBIDDEN.getHttpStatus()).body(
                ApiResponse.<Void>builder()
                        .code(ErrorCode.FORBIDDEN.getCode())
                        .message(ErrorCode.FORBIDDEN.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldError() != null 
                ? ex.getBindingResult().getFieldError().getDefaultMessage() 
                : "Dữ liệu không hợp lệ";
        return ResponseEntity.status(ErrorCode.INVALID_REQUEST.getHttpStatus()).body(
                ApiResponse.<Void>builder()
                        .code(ErrorCode.INVALID_REQUEST.getCode())
                        .message(msg)
                        .build()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unhandled Exception: ", ex);
        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getHttpStatus()).body(
                ApiResponse.<Void>builder()
                        .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                        .message(ex.getMessage() != null ? ex.getMessage() : ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                        .build()
        );
    }
}
