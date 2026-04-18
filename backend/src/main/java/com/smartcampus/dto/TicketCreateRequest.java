package com.smartcampus.dto;

import com.smartcampus.enums.PriorityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketCreateRequest(
        @Size(max = 80, message = "resourceId must be 80 characters or less.")
        String resourceId,

        @NotBlank(message = "category is required.")
        @Size(max = 80, message = "category must be 80 characters or less.")
        String category,

        @NotBlank(message = "description is required.")
        @Size(max = 1000, message = "description must be 1000 characters or less.")
        String description,

        @NotNull(message = "priority is required.")
        PriorityLevel priority,

        @NotBlank(message = "contactDetails is required.")
        @Size(max = 160, message = "contactDetails must be 160 characters or less.")
        String contactDetails
) {
}