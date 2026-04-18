package com.smartcampus.dto;

import jakarta.validation.constraints.Size;

public record BookingDecisionRequest(
        @Size(max = 500, message = "reason must be 500 characters or less.")
        String reason
) {
}