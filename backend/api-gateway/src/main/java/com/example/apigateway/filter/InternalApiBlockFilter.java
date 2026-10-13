package com.example.apigateway.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security Filter at API Gateway: Blocks external access to any internal microservice endpoints.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class InternalApiBlockFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Any external request attempting to reach /internal/ endpoints will be rejected with HTTP 403 Forbidden
        if (uri != null && uri.contains("/internal/")) {
            log.warn("Blocked external unauthorized access attempt to internal endpoint: {} from IP: {}", 
                    uri, request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"code\": 403, \"message\": \"Truy cập bị từ chối: Không thể truy cập API nội bộ từ bên ngoài gateway!\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
