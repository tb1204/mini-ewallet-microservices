package com.example.apigateway.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Global CORS Configuration for API Gateway
 * Intercepts cross-origin requests from web clients at HIGHEST_PRECEDENCE.
 * Automatically deduplicates Access-Control-Allow-Origin to prevent duplicate headers
 * when downstream microservices also configure CORS.
 */
@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> customCorsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(Collections.singletonList("*"));
        config.setAllowedHeaders(Collections.singletonList("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        config.setExposedHeaders(List.of("Authorization", "X-Trace-Id"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source) {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                if (CorsUtils.isPreFlightRequest(request)) {
                    super.doFilterInternal(request, response, filterChain);
                    return;
                }

                // Wrap response to deduplicate CORS headers written by downstream services
                HttpServletResponseWrapper dedupeWrapper = new HttpServletResponseWrapper(response) {
                    @Override
                    public void addHeader(String name, String value) {
                        if ("Access-Control-Allow-Origin".equalsIgnoreCase(name) ||
                            "Access-Control-Allow-Credentials".equalsIgnoreCase(name)) {
                            // Use setHeader to overwrite instead of appending duplicate comma-separated values
                            super.setHeader(name, value);
                            return;
                        }
                        super.addHeader(name, value);
                    }
                };

                super.doFilterInternal(request, dedupeWrapper, filterChain);
            }
        });

        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
