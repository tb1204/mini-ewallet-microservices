package com.example.auditservice.repository;

import com.example.auditservice.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.performer) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.targetUser) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<AuditLog> searchLogs(@Param("keyword") String keyword, Pageable pageable);

    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);
}
