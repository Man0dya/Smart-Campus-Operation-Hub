package com.smartcampus.service;

import com.smartcampus.dto.BookingCreateRequest;
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

    @Mock
    private ResourceService resourceService;

    @InjectMocks
    private BookingService bookingService;

    private BookingCreateRequest request;

    @BeforeEach
    void setUp() {
        request = new BookingCreateRequest(
                "res-1",
                "2026-05-10",
                "10:00",
                "11:00",
                "Lecture",
                50
        );
    }

    @Test
    void createBooking_shouldSetPendingAndSave() {
        when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10")).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking saved = bookingService.createBooking(request, "user-1");

        assertEquals(BookingStatus.PENDING, saved.getStatus());
        assertEquals("user-1", saved.getStatusChangedBy());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void createBooking_shouldThrowConflictOnOverlapWithPending() {
        Booking existing = Booking.builder()
                .id("b1")
                .resourceId("res-1")
                .userId("user-2")
                .date("2026-05-10")
                .startTime("10:30")
                .endTime("11:30")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10")).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(request, "user-1"));
    }

    @Test
    void createBooking_shouldThrowConflictOnOverlapWithApprovedFromAnotherUser() {
        Booking existing = Booking.builder()
                .id("b2")
                .resourceId("res-1")
                .userId("user-9")
                .date("2026-05-10")
                .startTime("10:20")
                .endTime("10:50")
                .status(BookingStatus.APPROVED)
                .build();

        when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10")).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(request, "user-1"));
    }

    @Test
    void rejectBooking_shouldRequireReason() {
        Booking existing = Booking.builder()
                .id("b1")
                .resourceId("res-1")
                .userId("user-1")
                .status(BookingStatus.PENDING)
                .build();
        when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> bookingService.rejectBooking("b1", "", "admin-1"));
    }

    @Test
    void approveBooking_shouldRejectInvalidCurrentState() {
        Booking existing = Booking.builder()
                .id("b1")
                .resourceId("res-1")
                .userId("user-1")
                .status(BookingStatus.APPROVED)
                .build();
        when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.approveBooking("b1", "ok", "admin-1"));
    }

    @Test
    void approveBooking_shouldThrowConflictWhenOverlapExists() {
    Booking bookingToApprove = Booking.builder()
        .id("b1")
        .resourceId("res-1")
        .userId("user-1")
        .date("2026-05-10")
        .startTime("10:00")
        .endTime("11:00")
        .status(BookingStatus.PENDING)
        .build();

    Booking existingApproved = Booking.builder()
        .id("b2")
        .resourceId("res-1")
        .userId("user-2")
        .date("2026-05-10")
        .startTime("10:30")
        .endTime("11:30")
        .status(BookingStatus.APPROVED)
        .build();

    when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(bookingToApprove));
    when(bookingRepository.findByResourceIdAndDate("res-1", "2026-05-10"))
        .thenReturn(List.of(bookingToApprove, existingApproved));

    assertThrows(ConflictException.class, () -> bookingService.approveBooking("b1", "ok", "admin-1"));
    }

    @Test
    void deleteBooking_shouldRemoveBookingById() {
        Booking existing = Booking.builder()
                .id("b1")
                .userId("user-1")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(existing));

        bookingService.deleteBooking("b1", "admin-1");

        verify(bookingRepository).deleteById("b1");
    }

    @Test
    void cancelBooking_shouldAllowPendingForOwner() {
        Booking existing = Booking.builder()
                .id("b1")
                .userId("user-1")
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(existing));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking cancelled = bookingService.cancelBooking("b1", "user-1", false);

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void cancelBooking_shouldRejectRejectedStatus() {
        Booking existing = Booking.builder()
                .id("b1")
                .userId("user-1")
                .status(BookingStatus.REJECTED)
                .build();

        when(bookingRepository.findById("b1")).thenReturn(java.util.Optional.of(existing));

        assertThrows(ConflictException.class, () -> bookingService.cancelBooking("b1", "user-1", false));
    }
}
