package com.example.identityservice.security;

import com.example.identityservice.constants.AppConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Security Filter intercepting every HTTP request once to extract, validate JWT token, and populate SecurityContext.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    /** Core filter method executing once per request to validate token and populate SecurityContextHolder. */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            // Step 1: Extract JWT token from 'Authorization' header
            String jwt = getJwtFromRequest(request);

            // Step 2: Validate token signature and expiration
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // Step 3: Extract userId and load UserPrincipal from database
                UUID userId = tokenProvider.getUserIdFromJWT(jwt);
                UserDetails userDetails = customUserDetailsService.loadUserById(userId);

                // Step 4: Build Authentication token object
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Step 5: Save authentication to SecurityContextHolder RAM for current request lifecycle
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in Security Context", ex);
        }

        // Continue request chain execution
        filterChain.doFilter(request, response);
    }

    /** Helper method extracting Bearer token from 'Authorization' HTTP header. */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AppConstants.HEADER_AUTHORIZATION);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(AppConstants.TOKEN_PREFIX)) {
            return bearerToken.substring(AppConstants.TOKEN_PREFIX.length());
        }
        return null;
    }
}

