package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentCreateRequest(
        @NotBlank(message = "ticketId is required.")
        String ticketId,

        @NotBlank(message = "message is required.")
        @Size(max = 1500, message = "message must be 1500 characters or less.")
        String message
) {
}