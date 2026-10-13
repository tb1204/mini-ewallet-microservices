package com.example.auditservice.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {

    private String key;

    private String value;

    private String description;

    private UUID updatedBy;

    private Instant updatedAt;
}
