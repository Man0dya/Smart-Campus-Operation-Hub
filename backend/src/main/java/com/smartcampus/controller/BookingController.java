package com.smartcampus.controller;

import com.smartcampus.enums.BookingStatus;
import com.smartcampus.model.Booking;
import com.smartcampus.model.User;
import com.smartcampus.service.CurrentUserService;
import com.smartcampus.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    public BookingController(BookingService bookingService, CurrentUserService currentUserService) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/my")
    public List<Booking> getMyBookings(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        return bookingService.getMyBookings(user.getId());
    }

    @GetMapping
    public List<Booking> getAllBookings(@AuthenticationPrincipal OAuth2User principal,
                                        @RequestParam(required = false) BookingStatus status,
                                        @RequestParam(required = false) String resourceId,
                                        @RequestParam(required = false) String date,
                                        @RequestParam(required = false) String userId) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        return bookingService.getAllBookings(status, resourceId, date, userId);
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking,
                                                 @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        booking.setUserId(user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(booking));
    }

    @PatchMapping("/{id}/approve")
    public Booking approveBooking(@PathVariable String id,
                                  @RequestBody(required = false) Map<String, String> request,
                                  @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        String reason = request == null ? null : request.get("reason");
        return bookingService.approveBooking(id, reason);
    }

    @PatchMapping("/{id}/reject")
    public Booking rejectBooking(@PathVariable String id,
                                 @RequestBody(required = false) Map<String, String> request,
                                 @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        currentUserService.requireAdmin(user);
        String reason = request == null ? null : request.get("reason");
        return bookingService.rejectBooking(id, reason);
    }

    @PatchMapping("/{id}/cancel")
    public Booking cancelBooking(@PathVariable String id,
                                 @AuthenticationPrincipal OAuth2User principal) {
        User user = currentUserService.requireUser(principal);
        boolean isAdmin = currentUserService.isAdmin(user);
        return bookingService.cancelBooking(id, user.getId(), isAdmin);
    }
}