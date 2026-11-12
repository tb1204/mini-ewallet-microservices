package com.example.auditservice.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private UUID id;

    private String timeStr;

    private Instant fullTimestamp;

    private String performer;

    private String performerRole;

    private String action;

    private String targetUser;

    private String serviceName;

    private String ipAddress;

    private String userAgent;

    private Map<String, Object> payload;

    private Map<String, Object> details;

    private Instant createdAt;
}
