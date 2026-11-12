package com.example.auditservice.controller;

import com.example.auditservice.dto.request.BatchUpdateConfigRequest;
import com.example.auditservice.dto.request.UpdateConfigRequest;
import com.example.auditservice.dto.response.ApiResponse;
import com.example.auditservice.dto.response.SystemConfigResponse;
import com.example.auditservice.service.SystemConfigService;
import com.example.auditservice.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/configs")
@RequiredArgsConstructor
@Slf4j
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /**
     * Get all active system configurations.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> getAllConfigs() {
        List<SystemConfigResponse> configs = systemConfigService.getAllConfigs();
        return ResponseEntity.ok(
                ApiResponse.<List<SystemConfigResponse>>builder()
                        .message("Lấy danh sách cấu hình hệ thống thành công")
                        .result(configs)
                        .data(configs)
                        .build()
        );
    }

    /**
     * Get specific configuration value by key.
     */
    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getConfigByKey(@PathVariable String key) {
        SystemConfigResponse config = systemConfigService.getConfig(key);
        return ResponseEntity.ok(
                ApiResponse.<SystemConfigResponse>builder()
                        .message("Lấy thông tin cấu hình thành công")
                        .result(config)
                        .data(config)
                        .build()
        );
    }

    /**
     * Admin Endpoint: Update single configuration item by key.
     */
    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateConfigRequest request) {
        UUID adminUserId = SecurityUtil.getCurrentUserId();
        SystemConfigResponse updated = systemConfigService.updateConfig(key, request, adminUserId);
        return ResponseEntity.ok(
                ApiResponse.<SystemConfigResponse>builder()
                        .message("Cập nhật cấu hình tham số thành công")
                        .result(updated)
                        .data(updated)
                        .build()
        );
    }

    /**
     * Admin Endpoint: Batch update multiple system configurations.
     */
    @PutMapping("/batch")
    public ResponseEntity<ApiResponse<List<SystemConfigResponse>>> updateBatchConfigs(
            @Valid @RequestBody BatchUpdateConfigRequest request) {
        UUID adminUserId = SecurityUtil.getCurrentUserId();
        List<SystemConfigResponse> updatedList = systemConfigService.updateBatchConfigs(request, adminUserId);
        return ResponseEntity.ok(
                ApiResponse.<List<SystemConfigResponse>>builder()
                        .message("Cập nhật danh sách cấu hình thành công")
                        .result(updatedList)
                        .data(updatedList)
                        .build()
        );
    }
}
