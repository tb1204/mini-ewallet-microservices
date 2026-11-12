package com.example.transactionservice.client;

import com.example.transactionservice.config.FeignClientConfig;
import com.example.transactionservice.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "audit-service", configuration = FeignClientConfig.class)
public interface AuditClient {

    @GetMapping("/api/v1/configs/{key}")
    ApiResponse<Map<String, Object>> getConfigByKey(@PathVariable("key") String key);
}

