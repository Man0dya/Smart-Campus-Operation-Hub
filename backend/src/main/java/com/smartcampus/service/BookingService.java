package com.smartcampus.service;

import com.smartcampus.dto.BookingCreateRequest;
import com.smartcampus.dto.BookingAvailabilityResponse;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final ResourceService resourceService;

    public BookingService(BookingRepository bookingRepository,
                          NotificationService notificationService,
                          ResourceService resourceService) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.resourceService = resourceService;
    }

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

        public BookingAvailabilityResponse getAvailability(String resourceId, String date) {
        Resource resource = resourceService.getResourceById(resourceId);
        List<BookingAvailabilityResponse.BookingInterval> blockedIntervals = bookingRepository
            .findByResourceIdAndDate(resourceId, date)
            .stream()
            .filter(booking -> booking.getStatus() == BookingStatus.PENDING
                || booking.getStatus() == BookingStatus.APPROVED)
            .map(booking -> new BookingAvailabilityResponse.BookingInterval(
                booking.getStartTime(),
                booking.getEndTime()
            ))
            .sorted((left, right) -> left.startTime().compareTo(right.startTime()))
            .toList();

        return new BookingAvailabilityResponse(
            resourceId,
            date,
            resource.getAvailabilityStart(),
            resource.getAvailabilityEnd(),
            blockedIntervals
        );
        }

    private boolean isOverlapping(String start1, String end1, String start2, String end2) {
        return start1.compareTo(end2) < 0 && end1.compareTo(start2) > 0;
    }

    private void ensureNoConflicts(Booking candidate, String ignoreBookingId) {
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndDate(
                candidate.getResourceId(),
                candidate.getDate()
        );

        for (Booking existing : existingBookings) {
            if (ignoreBookingId != null && Objects.equals(ignoreBookingId, existing.getId())) {
                continue;
            }

            if (existing.getStatus() == BookingStatus.PENDING || existing.getStatus() == BookingStatus.APPROVED) {
                if (isOverlapping(
                        candidate.getStartTime(),
                        candidate.getEndTime(),
                        existing.getStartTime(),
                        existing.getEndTime()
                )) {
                    throw new ConflictException("Booking conflict detected for this resource and time.");
                }
            }
        }
    }

    public Booking createBooking(BookingCreateRequest request, String userId) {
        if (request.startTime().compareTo(request.endTime()) >= 0) {
            throw new IllegalArgumentException("startTime must be before endTime.");
        }

        Booking booking = Booking.builder()
                .resourceId(request.resourceId())
                .userId(userId)
                .date(request.date())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .purpose(request.purpose())
                .expectedAttendees(request.expectedAttendees())
                .status(BookingStatus.PENDING)
                .adminReason(null)
                .build();

        ensureNoConflicts(booking, null);

        String now = Instant.now().toString();
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);
        booking.setStatusChangedAt(now);
        booking.setStatusChangedBy(userId);
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

    public Booking approveBooking(String bookingId, String adminReason, String actorUserId) {
        return updateStatus(bookingId, BookingStatus.APPROVED, adminReason, actorUserId);
    }

    public Booking rejectBooking(String bookingId, String adminReason, String actorUserId) {
        return updateStatus(bookingId, BookingStatus.REJECTED, adminReason, actorUserId);
    }

    public Booking cancelBooking(String bookingId, String requesterUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUserId().equals(requesterUserId)) {
            throw new ConflictException("You can only cancel your own bookings.");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new ConflictException("Only pending or approved bookings can be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(Instant.now().toString());
        booking.setStatusChangedAt(Instant.now().toString());
        booking.setStatusChangedBy(requesterUserId);
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

    public void deleteBooking(String bookingId, String actorUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        bookingRepository.deleteById(bookingId);

        if (!booking.getUserId().equals(actorUserId)) {
            notificationService.createNotification(
                    booking.getUserId(),
                    "Booking Deleted",
                    "Your booking " + bookingId + " was deleted by an administrator.",
                    "BOOKING"
            );
        }
    }

    private Booking updateStatus(String bookingId, BookingStatus targetStatus, String adminReason, String actorUserId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ConflictException("Only pending bookings can be approved or rejected.");
        }

        if (targetStatus == BookingStatus.REJECTED && (adminReason == null || adminReason.isBlank())) {
            throw new IllegalArgumentException("A rejection reason is required.");
        }

        if (targetStatus == BookingStatus.APPROVED) {
            ensureNoConflicts(booking, booking.getId());
        }

        booking.setStatus(targetStatus);
        booking.setAdminReason(adminReason == null ? null : adminReason.trim());
        String now = Instant.now().toString();
        booking.setUpdatedAt(now);
        booking.setStatusChangedAt(now);
        booking.setStatusChangedBy(actorUserId);
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