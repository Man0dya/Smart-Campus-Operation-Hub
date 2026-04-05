package com.smartcampus.service;

import com.smartcampus.enums.BookingStatus;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.model.Booking;
import com.smartcampus.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private Booking booking;

    @BeforeEach
    void setUp() {
        booking = Booking.builder()
                .resourceId("res-1")
                .userId("user-1")
                .date("2026-05-10")
                .startTime("10:00")
                .endTime("11:00")
                .purpose("Lecture")
                .expectedAttendees(50)
                .build();
    }

    @Test
    void createBooking_shouldSetPendingAndSave() {
        when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10")).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking saved = bookingService.createBooking(booking);

        assertEquals(BookingStatus.PENDING, saved.getStatus());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void createBooking_shouldThrowConflictOnOverlapWithPending() {
        Booking existing = Booking.builder()
                .id("b1")
                .resourceId("res-1")
                .date("2026-05-10")
                .startTime("10:30")
                .endTime("11:30")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10")).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(booking));
    }
}
