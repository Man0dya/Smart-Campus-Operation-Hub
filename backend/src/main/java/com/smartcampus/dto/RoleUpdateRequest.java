package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoleUpdateRequest(
        @NotBlank(message = "role is required.")
        @Pattern(regexp = "^(USER|ADMIN|TECHNICIAN)$", message = "role must be USER, ADMIN, or TECHNICIAN.")
        String role
) {
}
