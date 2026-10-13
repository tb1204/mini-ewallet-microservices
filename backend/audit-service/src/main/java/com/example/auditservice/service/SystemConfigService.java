package com.example.auditservice.service;

import com.example.auditservice.constants.ErrorCode;
import com.example.auditservice.dto.request.BatchUpdateConfigRequest;
import com.example.auditservice.dto.request.CreateAuditLogRequest;
import com.example.auditservice.dto.request.UpdateConfigRequest;
import com.example.auditservice.dto.response.SystemConfigResponse;
import com.example.auditservice.entity.SystemConfig;
import com.example.auditservice.exception.AppException;
import com.example.auditservice.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditLogService auditLogService;

    public List<SystemConfigResponse> getAllConfigs() {
        return systemConfigRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SystemConfigResponse getConfig(String key) {
        SystemConfig config = systemConfigRepository.findByKey(key)
                .orElseThrow(() -> new AppException(ErrorCode.CONFIG_NOT_FOUND));
        return mapToResponse(config);
    }

    @Transactional
    public SystemConfigResponse updateConfig(String key, UpdateConfigRequest request, UUID adminUserId) {
        log.info("Updating config key: {} to new value: {} by admin: {}", key, request.getValue(), adminUserId);

        SystemConfig config = systemConfigRepository.findByKey(key)
                .orElseGet(() -> SystemConfig.builder().key(key).build());

        String oldValue = config.getValue();
        config.setValue(request.getValue());
        if (request.getDescription() != null) {
            config.setDescription(request.getDescription());
        }
        config.setUpdatedBy(adminUserId);

        SystemConfig saved = systemConfigRepository.save(config);

        // Record Audit Log for configuration change
        Map<String, Object> details = new HashMap<>();
        details.put("key", key);
        details.put("oldValue", oldValue);
        details.put("newValue", request.getValue());

        auditLogService.recordAuditLog(CreateAuditLogRequest.builder()
                .userId(adminUserId)
                .action("UPDATE_CONFIG")
                .performer("Quản Trị Viên (Admin)")
                .performerRole("ROLE_ADMIN")
                .targetUser("Cấu Hình: " + key)
                .serviceName("audit-service")
                .details(details)
                .build());

        return mapToResponse(saved);
    }

    @Transactional
    public List<SystemConfigResponse> updateBatchConfigs(BatchUpdateConfigRequest request, UUID adminUserId) {
        log.info("Updating batch configs: count: {} by admin: {}", request.getConfigs().size(), adminUserId);

        List<SystemConfigResponse> responses = new ArrayList<>();
        Map<String, Object> auditChanges = new HashMap<>();

        for (Map.Entry<String, String> entry : request.getConfigs().entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            SystemConfig config = systemConfigRepository.findByKey(key)
                    .orElseGet(() -> SystemConfig.builder().key(key).build());

            String oldValue = config.getValue();
            config.setValue(value);
            config.setUpdatedBy(adminUserId);

            SystemConfig saved = systemConfigRepository.save(config);
            responses.add(mapToResponse(saved));

            Map<String, String> change = new HashMap<>();
            change.put("old", oldValue);
            change.put("new", value);
            auditChanges.put(key, change);
        }

        // Record Audit Log for batch configuration update
        auditLogService.recordAuditLog(CreateAuditLogRequest.builder()
                .userId(adminUserId)
                .action("BATCH_UPDATE_CONFIG")
                .performer("Quản Trị Viên (Admin)")
                .performerRole("ROLE_ADMIN")
                .targetUser("Hệ Thống Tham Số")
                .serviceName("audit-service")
                .details(auditChanges)
                .build());

        return responses;
    }

    public SystemConfigResponse mapToResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .key(config.getKey())
                .value(config.getValue())
                .description(config.getDescription())
                .updatedBy(config.getUpdatedBy())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
