package com.smartcampus.dto;

import java.util.List;

public record BookingAvailabilityResponse(
        String resourceId,
        String date,
        String availabilityStart,
        String availabilityEnd,
        List<BookingInterval> blockedIntervals
) {
    public record BookingInterval(
            String startTime,
            String endTime
    ) {
    }
}
