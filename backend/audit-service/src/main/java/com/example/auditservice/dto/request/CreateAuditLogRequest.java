package com.example.auditservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuditLogRequest {

    private UUID userId;

    @NotBlank(message = "Hành động không được để trống")
    private String action;

    private String performer;

    private String performerRole;

    private String targetUser;

    private String serviceName;

    private String ipAddress;

    private String userAgent;

    private Map<String, Object> details;
}
