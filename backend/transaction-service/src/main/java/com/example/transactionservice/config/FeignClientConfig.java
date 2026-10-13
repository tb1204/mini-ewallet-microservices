package com.example.transactionservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignClientConfig {

    @Value("${internal.secret:ewallet-internal-secret-2026}")
    private String internalSecret;

    @Bean
    public RequestInterceptor feignRequestInterceptor() {
        return (RequestTemplate template) -> {
            // 1. Attach Internal Secret Header for secure inter-service communication
            template.header("X-Internal-Secret", internalSecret);

            // 2. Propagate Bearer JWT Authorization header if present in current HTTP context
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authHeader = request.getHeader("Authorization");
                if (StringUtils.hasText(authHeader)) {
                    template.header("Authorization", authHeader);
                }
            }
        };
    }
}
