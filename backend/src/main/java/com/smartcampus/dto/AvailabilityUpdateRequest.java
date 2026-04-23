package com.smartcampus.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AvailabilityUpdateRequest(
        @NotNull(message = "status is required.")
        @Pattern(regexp = "AVAILABLE|BUSY|ON_LEAVE|UNAVAILABLE", message = "Invalid availability status.")
        String status,

        @Size(max = 250, message = "availabilityNote must be 250 characters or less.")
        String note
) {
}
