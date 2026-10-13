package com.example.auditservice.security;

import com.example.auditservice.constants.AppConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter ensuring all /api/v1/audit/logs/internal/** endpoints require valid X-Internal-Secret header.
 */
@Component
@Slf4j
public class InternalAuthFilter extends OncePerRequestFilter {

    @Value("${internal.secret:ewallet-internal-secret-2026}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        if (path != null && path.contains("/internal")) {
            String incomingSecret = request.getHeader(AppConstants.HEADER_INTERNAL_SECRET);

            if (!StringUtils.hasText(incomingSecret) || !incomingSecret.equals(internalSecret)) {
                log.warn("Unauthorized internal access attempt to path: {} from IP: {}", path, request.getRemoteAddr());
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"code\": 403, \"message\": \"Truy cập bị từ chối: Thiếu hoặc sai X-Internal-Secret!\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
