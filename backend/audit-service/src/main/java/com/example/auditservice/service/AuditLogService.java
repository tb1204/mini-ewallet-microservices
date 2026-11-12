package com.example.auditservice.service;

import com.example.auditservice.constants.ErrorCode;
import com.example.auditservice.dto.request.CreateAuditLogRequest;
import com.example.auditservice.dto.response.AuditLogResponse;
import com.example.auditservice.entity.AuditLog;
import com.example.auditservice.exception.AppException;
import com.example.auditservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss").withZone(ZoneId.systemDefault());

    @Transactional
    public AuditLogResponse recordAuditLog(CreateAuditLogRequest request) {
        log.info("Recording Audit Log: Action: {}, Performer: {}, Target: {}", 
                request.getAction(), request.getPerformer(), request.getTargetUser());

        AuditLog auditLog = AuditLog.builder()
                .userId(request.getUserId())
                .action(request.getAction())
                .performer(request.getPerformer() != null ? request.getPerformer() : "Hệ Thống")
                .performerRole(request.getPerformerRole() != null ? request.getPerformerRole() : "ROLE_SYSTEM")
                .targetUser(request.getTargetUser() != null ? request.getTargetUser() : "-")
                .serviceName(request.getServiceName() != null ? request.getServiceName() : "audit-service")
                .ipAddress(request.getIpAddress())
                .userAgent(request.getUserAgent())
                .details(request.getDetails())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        return mapToAuditLogResponse(saved);
    }

    public Page<AuditLogResponse> getLogs(String keyword, Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.searchLogs(keyword, pageable);
        return page.map(this::mapToAuditLogResponse);
    }

    public AuditLogResponse getLogById(UUID id) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.AUDIT_LOG_NOT_FOUND));
        return mapToAuditLogResponse(auditLog);
    }

    public AuditLogResponse mapToAuditLogResponse(AuditLog log) {
        String timeStr = log.getCreatedAt() != null ? TIME_FORMATTER.format(log.getCreatedAt()) : "";

        return AuditLogResponse.builder()
                .id(log.getId())
                .timeStr(timeStr)
                .fullTimestamp(log.getCreatedAt())
                .performer(log.getPerformer())
                .performerRole(log.getPerformerRole())
                .action(log.getAction())
                .targetUser(log.getTargetUser())
                .serviceName(log.getServiceName())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .payload(log.getDetails())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
