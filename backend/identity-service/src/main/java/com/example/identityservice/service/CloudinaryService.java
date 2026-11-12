package com.example.identityservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import com.example.identityservice.constants.ErrorCode;
import com.example.identityservice.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload avatar image to Cloudinary and return the HTTPS CDN secure URL.
     */
    public String uploadAvatar(MultipartFile file, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Vui lòng chọn file ảnh hợp lệ");
        }

        // Validate image content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Định dạng file không được hỗ trợ. Vui lòng chọn file ảnh (JPG, PNG, WebP)!");
        }

        // Max 5MB
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Kích thước ảnh vượt quá giới hạn 5MB!");
        }

        try {
            Map<?, ?> uploadParams = ObjectUtils.asMap(
                    "folder", "mini-ewallet/avatars",
                    "public_id", "avatar_" + userId,
                    "overwrite", true,
                    "resource_type", "image",
                    "transformation", new Transformation<>()
                            .width(500)
                            .height(500)
                            .crop("fill")
                            .gravity("face")
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Cloudinary upload successful for user {}: {}", userId, secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Cloudinary upload failed for user {}: {}", userId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Không thể tải ảnh lên máy chủ Cloudinary: " + e.getMessage());
        }
    }

    /**
     * Delete existing avatar from Cloudinary if needed.
     */
    public void deleteAvatar(UUID userId) {
        try {
            String publicId = "mini-ewallet/avatars/avatar_" + userId;
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted avatar on Cloudinary for user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to delete avatar on Cloudinary for user {}: {}", userId, e.getMessage());
        }
    }
}
