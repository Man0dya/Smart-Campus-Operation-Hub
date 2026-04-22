package com.smartcampus.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Attachment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class TicketAttachmentStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;

    private final Cloudinary cloudinary;
    private final String ticketFolder;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final Path uploadPath;

    public TicketAttachmentStorageService(
            Cloudinary cloudinary,
            @Value("${cloudinary.ticket-folder:smart-campus/tickets}") String ticketFolder,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.cloudinary = cloudinary;
        this.ticketFolder = ticketFolder;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Legacy fallback: allow reading previously stored local attachments.
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not initialize upload directory.", ex);
        }
    }

    public List<Attachment> storeTicketImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("At least one image file is required.");
        }

        ensureCloudinaryConfigured();

        return Arrays.stream(files)
                .map(this::uploadSingleImage)
                .toList();
    }

    public void deleteAttachments(List<Attachment> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return;
        }

        // If Cloudinary isn't configured, we can't delete from Cloudinary anyway.
        if (!isCloudinaryConfigured()) {
            return;
        }

        for (Attachment attachment : attachments) {
            if (attachment == null) {
                continue;
            }

            String publicId = attachment.getPublicId();
            if (publicId == null || publicId.isBlank()) {
                continue;
            }

            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                        "resource_type", "image",
                        "invalidate", true
                ));
            } catch (Exception ignored) {
                // Best-effort cleanup; ticket deletion should not fail because Cloudinary deletion failed.
            }
        }
    }

    /**
     * Legacy fallback for tickets created before Cloudinary storage.
     */
    public Resource loadAsResource(String fileName) {
        try {
            Path filePath = uploadPath.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("Attachment not found: " + fileName);
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Attachment not found: " + fileName);
        }
    }

    private Attachment uploadSingleImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file cannot be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Each attachment must be 5MB or smaller.");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());

        if (originalName.contains("..")) {
            throw new IllegalArgumentException("Invalid attachment file name.");
        }

        String extension = getFileExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Only png, jpg, jpeg, and webp attachments are allowed.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image attachments are allowed.");
        }

        try {
            String publicId = ticketFolder + "/" + UUID.randomUUID();

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "resource_type", "image",
                    "public_id", publicId,
                    "overwrite", false,
                    "unique_filename", true,
                    "invalidate", true
            ));

            String secureUrl = (String) result.get("secure_url");
            String storedPublicId = (String) result.get("public_id");

            if (secureUrl == null || secureUrl.isBlank()) {
                throw new IllegalStateException("Cloudinary did not return a secure URL for the uploaded attachment.");
            }

            return Attachment.builder()
                    .fileName(originalName)
                    .fileUrl(secureUrl)
                    .publicId(storedPublicId)
                    .build();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload attachment.", ex);
        }
    }

    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index < 0 || index == fileName.length() - 1) {
            throw new IllegalArgumentException("Attachment must include a valid file extension.");
        }
        return fileName.substring(index + 1);
    }

    private void ensureCloudinaryConfigured() {
        if (!isCloudinaryConfigured()) {
            throw new IllegalStateException(
                    "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env (or environment variables)."
            );
        }
    }

    private boolean isCloudinaryConfigured() {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }
}
