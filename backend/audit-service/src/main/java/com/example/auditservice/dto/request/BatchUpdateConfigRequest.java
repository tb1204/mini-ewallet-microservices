package com.example.auditservice.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateConfigRequest {

    @NotEmpty(message = "Danh sách cấu hình cập nhật không được để trống")
    private Map<String, String> configs;
}
