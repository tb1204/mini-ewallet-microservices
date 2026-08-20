package com.example.identityservice.repositories;

import com.example.identityservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for User entity offering custom finder and existence query methods.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /** Find user by exact username. */
    Optional<User> findByUsername(String username);

    /** Find user by exact email. */
    Optional<User> findByEmail(String email);

    /** Find user by phone number. */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /** Find user matching either username or email (used during authentication). */
    Optional<User> findByUsernameOrEmail(String username, String email);

    /** Check if username already exists. */
    boolean existsByUsername(String username);

    /** Check if email already exists. */
    boolean existsByEmail(String email);

    /** Check if phone number already exists. */
    boolean existsByPhoneNumber(String phoneNumber);
}

