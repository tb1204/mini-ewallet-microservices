package com.example.walletservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that blocks any direct external access to wallet-service.
 * All client requests must be routed via API Gateway (with X-Gateway-Token)
 * or come from internal microservices (with X-Internal-Secret).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class GatewayOnlyFilter extends OncePerRequestFilter {

    @Value("${gateway.token:ewallet-gateway-key-2026}")
    private String gatewayToken;

    @Value("${internal.secret:ewallet-internal-secret-2026}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        // 1. Cho phép actuator & swagger
        if (path != null && (path.startsWith("/actuator") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui"))) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Cho phép các request nội bộ từ các microservice khác (với X-Internal-Secret)
        String internalHeader = request.getHeader("X-Internal-Secret");
        if (StringUtils.hasText(internalHeader) && internalHeader.equals(internalSecret)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Cho phép các request được chuyển tiếp qua API Gateway (với X-Gateway-Token)
        String gatewayHeader = request.getHeader("X-Gateway-Token");
        if (StringUtils.hasText(gatewayHeader) && gatewayHeader.equals(gatewayToken)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Chặn mọi truy cập trực tiếp từ bên ngoài
        log.warn("Blocked direct access attempt to wallet-service at: {} from IP: {}", path, request.getRemoteAddr());
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"code\": 403, \"message\": \"Truy cập trực tiếp bị từ chối! Vui lòng truy cập thông qua API Gateway (cổng 8080).\"}");
    }
}
