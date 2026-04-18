package com.smartcampus.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BookingCreateRequest(
        @NotBlank(message = "resourceId is required.")
        String resourceId,

        @NotBlank(message = "date is required.")
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "date must be in YYYY-MM-DD format.")
        String date,

        @NotBlank(message = "startTime is required.")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "startTime must be in HH:mm format.")
        String startTime,

        @NotBlank(message = "endTime is required.")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "endTime must be in HH:mm format.")
        String endTime,

        @NotBlank(message = "purpose is required.")
        @Size(max = 300, message = "purpose must be 300 characters or less.")
        String purpose,

        @Min(value = 1, message = "expectedAttendees must be at least 1 when provided.")
        @Max(value = 5000, message = "expectedAttendees must be 5000 or less.")
        Integer expectedAttendees
) {
}