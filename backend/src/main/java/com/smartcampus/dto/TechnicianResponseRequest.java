package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TechnicianResponseRequest(
        @NotBlank(message = "response is required.")
        @Size(max = 1500, message = "response must be 1500 characters or less.")
        String response
) {
}
