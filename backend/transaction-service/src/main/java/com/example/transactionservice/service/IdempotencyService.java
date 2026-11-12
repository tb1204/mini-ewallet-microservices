package com.example.transactionservice.service;

import com.example.transactionservice.constants.ErrorCode;
import com.example.transactionservice.entity.IdempotencyKey;
import com.example.transactionservice.exception.AppException;
import com.example.transactionservice.repository.IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;

    public Optional<IdempotencyKey> checkKey(String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }

        Optional<IdempotencyKey> existingKey = idempotencyKeyRepository.findById(key);
        if (existingKey.isPresent()) {
            IdempotencyKey idemp = existingKey.get();
            if (Instant.now().isAfter(idemp.getExpiresAt())) {
                idempotencyKeyRepository.delete(idemp);
                return Optional.empty();
            }
            if ("PROCESSING".equals(idemp.getStatus())) {
                throw new AppException(ErrorCode.DUPLICATE_REQUEST);
            }
            return Optional.of(idemp);
        }
        return Optional.empty();
    }

    public IdempotencyKey createKey(String key, UUID userId, String requestPath) {
        if (key == null || key.isBlank()) {
            key = "IDEMP-" + UUID.randomUUID();
        }

        IdempotencyKey idemp = IdempotencyKey.builder()
                .key(key)
                .userId(userId)
                .requestPath(requestPath)
                .status("PROCESSING")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        return idempotencyKeyRepository.save(idemp);
    }

    public void completeKey(String key, int responseCode, String responseBody) {
        if (key == null || key.isBlank()) return;

        idempotencyKeyRepository.findById(key).ifPresent(idemp -> {
            idemp.setStatus("COMPLETED");
            idemp.setResponseCode(responseCode);
            idemp.setResponseBody(responseBody);
            idempotencyKeyRepository.save(idemp);
        });
    }

    public void failKey(String key) {
        if (key == null || key.isBlank()) return;

        idempotencyKeyRepository.findById(key).ifPresent(idemp -> {
            idemp.setStatus("FAILED");
            idempotencyKeyRepository.save(idemp);
        });
    }
}
