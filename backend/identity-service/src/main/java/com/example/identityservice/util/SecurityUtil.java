package com.example.identityservice.util;

import com.example.identityservice.constants.ErrorCode;
import com.example.identityservice.exception.AppException;
import com.example.identityservice.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Helper utility class retrieving current authenticated UserPrincipal, User UUID, or Username from SecurityContextHolder.
 */
public class SecurityUtil {

    private SecurityUtil() {
        // Private constructor to prevent instantiation
    }

    /** Retrieve optional UserPrincipal from current thread's SecurityContextHolder. */
    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    /** Retrieve current authenticated user's UUID or throw UNAUTHENTICATED AppException. */
    public static UUID getCurrentUserId() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    /** Retrieve current authenticated user's username or throw UNAUTHENTICATED AppException. */
    public static String getCurrentUsername() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getUsername)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }
}

