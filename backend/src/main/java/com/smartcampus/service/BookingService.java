package com.smartcampus.service;

import com.smartcampus.enums.BookingStatus;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Booking;
import com.smartcampus.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    private boolean isOverlapping(String start1, String end1, String start2, String end2) {
        return start1.compareTo(end2) < 0 && end1.compareTo(start2) > 0;
    }

    public Booking createBooking(Booking booking) {
        if (booking.getResourceId() == null || booking.getDate() == null || booking.getStartTime() == null || booking.getEndTime() == null) {
            throw new IllegalArgumentException("resourceId, date, startTime and endTime are required.");
        }

        if (booking.getStartTime().compareTo(booking.getEndTime()) >= 0) {
            throw new IllegalArgumentException("startTime must be before endTime.");
        }

        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDate(
                booking.getResourceId(),
                booking.getDate()
        );

        for (Booking existing : existingBookings) {
            if (existing.getStatus() == BookingStatus.PENDING || existing.getStatus() == BookingStatus.APPROVED) {
                if (isOverlapping(
                        booking.getStartTime(),
                        booking.getEndTime(),
                        existing.getStartTime(),
                        existing.getEndTime()
                )) {
                    throw new ConflictException("Booking conflict detected for this resource and time.");
                }
            }
        }

        booking.setStatus(BookingStatus.PENDING);
        booking.setAdminReason(null);
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings(BookingStatus status,
                                        String resourceId,
                                        String date,
                                        String userId) {
        return bookingRepository.findAll().stream()
                .filter(booking -> status == null || booking.getStatus() == status)
                .filter(booking -> resourceId == null || (booking.getResourceId() != null
                        && booking.getResourceId().toLowerCase(Locale.ROOT).contains(resourceId.toLowerCase(Locale.ROOT))))
                .filter(booking -> date == null || date.equals(booking.getDate()))
                .filter(booking -> userId == null || userId.equals(booking.getUserId()))
                .toList();
    }

    public Booking approveBooking(String bookingId, String adminReason) {
        return updateStatus(bookingId, BookingStatus.APPROVED, adminReason);
    }

    public Booking rejectBooking(String bookingId, String adminReason) {
        return updateStatus(bookingId, BookingStatus.REJECTED, adminReason);
    }

    public Booking cancelBooking(String bookingId, String requesterUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUserId().equals(requesterUserId)) {
            throw new ConflictException("You can only cancel your own bookings.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        if (!saved.getUserId().equals(requesterUserId)) {
            notificationService.createNotification(
                    saved.getUserId(),
                    "Booking Cancelled",
                    "Your booking " + saved.getId() + " was cancelled by an administrator.",
                    "BOOKING"
            );
        }

        return saved;
    }

    private Booking updateStatus(String bookingId, BookingStatus targetStatus, String adminReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("Cancelled bookings cannot be updated.");
        }

        booking.setStatus(targetStatus);
        booking.setAdminReason(adminReason);
        Booking saved = bookingRepository.save(booking);

        String action = targetStatus == BookingStatus.APPROVED ? "approved" : "rejected";
        notificationService.createNotification(
                saved.getUserId(),
                "Booking " + targetStatus,
                "Your booking " + saved.getId() + " was " + action + ".",
                "BOOKING"
        );

        return saved;
    }
}