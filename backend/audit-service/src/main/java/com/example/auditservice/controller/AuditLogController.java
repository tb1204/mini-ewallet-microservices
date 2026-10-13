package com.example.auditservice.controller;

import com.example.auditservice.dto.request.CreateAuditLogRequest;
import com.example.auditservice.dto.response.ApiResponse;
import com.example.auditservice.dto.response.AuditLogResponse;
import com.example.auditservice.service.AuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit/logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Inter-service Endpoint: Record an audit log event from other microservices.
     * Protected by InternalAuthFilter (requires valid X-Internal-Secret).
     */
    @PostMapping("/internal")
    public ResponseEntity<ApiResponse<AuditLogResponse>> recordInternalLog(
            @Valid @RequestBody CreateAuditLogRequest request) {
        AuditLogResponse response = auditLogService.recordAuditLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<AuditLogResponse>builder()
                        .message("Ghi nhận nhật ký kiểm toán thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }

    /**
     * Admin/Staff Endpoint: Query paginated audit logs with search keyword and sorting.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogs(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<AuditLogResponse> logPage = auditLogService.getLogs(keyword, pageable);

        return ResponseEntity.ok(
                ApiResponse.<List<AuditLogResponse>>builder()
                        .message("Lấy danh sách nhật ký kiểm toán thành công")
                        .result(logPage.getContent())
                        .data(logPage.getContent())
                        .build()
        );
    }

    /**
     * Admin/Staff Endpoint: Get specific audit log detail by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getLogById(@PathVariable UUID id) {
        AuditLogResponse response = auditLogService.getLogById(id);
        return ResponseEntity.ok(
                ApiResponse.<AuditLogResponse>builder()
                        .message("Lấy thông tin chi tiết nhật ký thành công")
                        .result(response)
                        .data(response)
                        .build()
        );
    }
}
