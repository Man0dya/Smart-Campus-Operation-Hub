package com.smartcampus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminUserUpdateRequest(
        @NotBlank(message = "name is required.")
        @Size(max = 120, message = "name must be 120 characters or less.")
        String name,

        @NotBlank(message = "email is required.")
        @Email(message = "email must be valid.")
        String email,

        @Pattern(regexp = "^(USER|ADMIN|TECHNICIAN)?$", message = "role must be USER, ADMIN, or TECHNICIAN.")
        String role,

        @Pattern(regexp = "^$|^.{6,120}$", message = "password must be between 6 and 120 characters when provided.")
        String password
) {
}
