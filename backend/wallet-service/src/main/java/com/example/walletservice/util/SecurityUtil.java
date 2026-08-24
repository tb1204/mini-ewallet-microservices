package com.example.walletservice.util;

import com.example.walletservice.constants.ErrorCode;
import com.example.walletservice.exception.AppException;
import com.example.walletservice.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Helper utility class retrieving current authenticated UserPrincipal or User UUID from SecurityContextHolder.
 */
public class SecurityUtil {

    private SecurityUtil() {
        // Private constructor to prevent instantiation
    }

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal);
        }
        return Optional.empty();
    }

    public static UUID getCurrentUserId() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }
}
