package com.example.identityservice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Utility component handling creation, parsing, and cryptographic verification of JWT Access Tokens using JJWT 0.12.5.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    /** Generate cryptographic SecretKey for HMAC-SHA signing from configured secret string. */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /** Generate signed JWT Access Token containing userId (subject), username, role, and expiration timestamp. */
    public String generateAccessToken(UUID userId, String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /** Decrypt and parse JWT Token to extract the subject (user UUID). */
    public UUID getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return UUID.fromString(claims.getSubject());
    }

    /** Validate token signature, structure, and expiration date. Returns true if valid, false otherwise. */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.error("Chữ ký JWT không hợp lệ");
        } catch (ExpiredJwtException ex) {
            log.error("JWT Token đã hết hạn");
        } catch (UnsupportedJwtException ex) {
            log.error("JWT Token không được hỗ trợ");
        } catch (IllegalArgumentException ex) {
            log.error("JWT chuỗi rỗng");
        }
        return false;
    }

    /** Return access token expiration duration in milliseconds. */
    public long getExpirationInMs() {
        return jwtExpirationInMs;
    }
}

