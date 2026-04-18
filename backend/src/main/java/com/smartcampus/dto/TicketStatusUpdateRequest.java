package com.smartcampus.dto;

import com.smartcampus.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketStatusUpdateRequest(
        @NotNull(message = "status is required.")
        TicketStatus status,

        @Size(max = 120, message = "assignedTo must be 120 characters or less.")
        String assignedTo,

        @Size(max = 1500, message = "resolutionNotes must be 1500 characters or less.")
        String resolutionNotes
) {
}