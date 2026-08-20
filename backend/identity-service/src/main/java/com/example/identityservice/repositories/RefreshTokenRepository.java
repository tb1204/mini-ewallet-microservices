package com.example.identityservice.repositories;

import com.example.identityservice.entity.RefreshToken;
import com.example.identityservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for RefreshToken entity operations (find by token string, revocation by user or token).
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /** Find RefreshToken record by its unique token string. */
    Optional<RefreshToken> findByToken(String token);

    /** Delete all refresh tokens associated with a given user (logout / revocation). */
    void deleteByUser(User user);

    /** Delete a specific refresh token by string value. */
    void deleteByToken(String token);
}

