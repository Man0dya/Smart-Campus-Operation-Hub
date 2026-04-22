package com.smartcampus.service;

import com.smartcampus.dto.TicketCreateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
    }

    public Ticket createTicket(TicketCreateRequest request, String reporterUserId) {
        Ticket ticket = Ticket.builder()
                .resourceId(request.resourceId())
                .reportedBy(reporterUserId)
                .category(request.category())
                .description(request.description())
                .priority(request.priority())
                .contactDetails(request.contactDetails())
                .status(TicketStatus.OPEN)
                .resolutionNotes(null)
                .build();

        String now = Instant.now().toString();
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(reporterUserId);

        Ticket saved = ticketRepository.save(ticket);

        // Auto-comment: ticket creation
        createSystemComment(saved.getId(), "SYSTEM",
                "\uD83D\uDCCB Ticket created and is now OPEN. Awaiting admin review and technician assignment.");

        // Notify all admins about the new ticket
        notifyAllAdmins("New Ticket Reported",
                "A new ticket #" + saved.getId() + " has been reported and needs assignment.",
                "TICKET");

        return saved;
    }

    public List<Ticket> getAllTickets() {
        List<Ticket> all = ticketRepository.findAll();
        all.sort((a, b) -> {
            String ta = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String tb = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return tb.compareTo(ta);
        });
        return all;
    }

    public List<Ticket> getMyTickets(String reportedByUserId) {
        List<Ticket> list = ticketRepository.findByReportedBy(reportedByUserId);
        list.sort((a, b) -> {
            String ta = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String tb = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return tb.compareTo(ta);
        });
        return list;
    }

    public List<Ticket> getAssignedTickets(String technicianUserId) {
        List<Ticket> list = ticketRepository.findByAssignedTo(technicianUserId);
        list.sort((a, b) -> {
            String ta = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String tb = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return tb.compareTo(ta);
        });
        return list;
    }

    public Ticket getTicketById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    public Ticket updateTicketStatus(String id, TicketStatus status, String assignedTo, String resolutionNotes, User actor, boolean actorIsAdminOrTech) {
        if (!actorIsAdminOrTech) {
            throw new ForbiddenOperationException("Only admin or technician can update ticket workflow.");
        }

        Ticket ticket = getTicketById(id);

        if (ticket.getStatus() == status && (assignedTo == null || assignedTo.isBlank())) {
            return ticket;
        }

        if (ticket.getStatus() != status && !isValidTransition(ticket.getStatus(), status)) {
            throw new ConflictException("Invalid ticket status transition from " + ticket.getStatus() + " to " + status + ".");
        }

        if (status == TicketStatus.REJECTED && (resolutionNotes == null || resolutionNotes.isBlank())) {
            throw new IllegalArgumentException("A rejection reason is required when setting status to REJECTED.");
        }

        TicketStatus previousStatus = ticket.getStatus();
        ticket.setStatus(status);

        if (assignedTo != null && !assignedTo.isBlank()) {
            ticket.setAssignedTo(assignedTo);
        }

        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes.trim());
        }

        String now = Instant.now().toString();
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(actor.getId());

        Ticket saved = ticketRepository.save(ticket);

        // ---- Notification & auto-comment pipeline based on transition ----
        handleStatusTransitionEffects(saved, previousStatus, status, assignedTo, resolutionNotes, actor);

        return saved;
    }

    /**
     * Central handler for all side-effects of ticket status transitions:
     * notifications to all relevant parties and system comments on the ticket thread.
     */
    private void handleStatusTransitionEffects(Ticket ticket, TicketStatus from, TicketStatus to,
                                                String assignedTo, String resolutionNotes, User actor) {
        String actorName = actor.getName() != null ? actor.getName() : actor.getEmail();
        String ticketRef = "#" + ticket.getId();

        switch (to) {
            case IN_PROGRESS -> {
                // Assignment: Admin assigns a technician
                if (assignedTo != null && !assignedTo.isBlank()) {
                    String techName = resolveUserName(assignedTo);

                    // Mark technician as unavailable
                    setTechnicianAvailability(assignedTo, false);

                    // Notify the assigned technician
                    notificationService.createNotification(
                            assignedTo,
                            "Ticket Assigned to You",
                            "You have been assigned to ticket " + ticketRef + ". Please review and resolve the issue.",
                            "TICKET"
                    );

                    // Notify the reporter
                    notificationService.createNotification(
                            ticket.getReportedBy(),
                            "Ticket Assigned",
                            "Your ticket " + ticketRef + " has been assigned to technician " + techName + " and is now in progress.",
                            "TICKET"
                    );

                    // System comment on the ticket
                    createSystemComment(ticket.getId(), "SYSTEM",
                            "\uD83D\uDD27 Ticket assigned to " + techName + " by " + actorName + ". Status changed to IN_PROGRESS.");
                } else {
                    // Status change without assignment
                    notificationService.createNotification(
                            ticket.getReportedBy(),
                            "Ticket In Progress",
                            "Your ticket " + ticketRef + " is now being worked on.",
                            "TICKET"
                    );

                    createSystemComment(ticket.getId(), "SYSTEM",
                            "\u2699\uFE0F Status changed to IN_PROGRESS by " + actorName + ".");
                }
            }

            case CLOSED -> {
                // Technician marks ticket as done → ticket goes straight to CLOSED
                String notes = (resolutionNotes != null && !resolutionNotes.isBlank())
                        ? resolutionNotes.trim() : "";

                // Mark technician as available again
                if (ticket.getAssignedTo() != null) {
                    setTechnicianAvailability(ticket.getAssignedTo(), true);
                }

                // Notify the reporter
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        "Ticket Resolved & Closed",
                        "Your ticket " + ticketRef + " has been fixed and closed by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes),
                        "TICKET"
                );

                // Notify all admins
                notifyAllAdmins("Ticket Closed",
                        "Ticket " + ticketRef + " has been resolved and closed by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes),
                        "TICKET");

                // System comment on the ticket
                createSystemComment(ticket.getId(), "SYSTEM",
                        "\u2705 Issue resolved and ticket closed by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes));
            }

            case REJECTED -> {
                String reason = (resolutionNotes != null && !resolutionNotes.isBlank())
                        ? resolutionNotes.trim() : "No reason provided.";

                // Notify the reporter
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        "Ticket Rejected",
                        "Your ticket " + ticketRef + " has been rejected. Reason: " + reason,
                        "TICKET"
                );

                // If there was an assigned technician, notify them too
                if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().isBlank()) {
                    setTechnicianAvailability(ticket.getAssignedTo(), true);

                    notificationService.createNotification(
                            ticket.getAssignedTo(),
                            "Ticket Rejected",
                            "Ticket " + ticketRef + " has been rejected by " + actorName + ".",
                            "TICKET"
                    );
                }

                // System comment on the ticket
                createSystemComment(ticket.getId(), "SYSTEM",
                        "\u274C Ticket rejected by " + actorName + ". Reason: " + reason);
            }

            default -> {
                // Fallback notification for any other status change
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        "Ticket " + to,
                        "Your ticket " + ticketRef + " is now " + to + ".",
                        "TICKET"
                );
            }
        }
    }

    public void ensureTicketAccess(Ticket ticket, User actor, boolean actorIsAdminOrTech) {
        if (!actorIsAdminOrTech && !ticket.getReportedBy().equals(actor.getId())) {
            throw new ForbiddenOperationException("You can only access your own tickets.");
        }
    }

    public Ticket addAttachments(String ticketId, List<Attachment> newAttachments) {
        Ticket ticket = getTicketById(ticketId);

        List<Attachment> existing = ticket.getAttachments() == null
                ? new ArrayList<>()
                : new ArrayList<>(ticket.getAttachments());

        if (existing.size() + newAttachments.size() > 3) {
            throw new IllegalArgumentException("A ticket can have a maximum of 3 image attachments.");
        }

        existing.addAll(newAttachments);
        ticket.setAttachments(existing);
        ticket.setUpdatedAt(Instant.now().toString());
        return ticketRepository.save(ticket);
    }

    public void deleteTicket(String ticketId, User actor) {
        if (actor == null || actor.getRole() != Role.ADMIN) {
            throw new ForbiddenOperationException("Only admin can delete tickets.");
        }

        Ticket ticket = getTicketById(ticketId);
        ticketRepository.deleteById(ticketId);

        if (!ticket.getReportedBy().equals(actor.getId())) {
            notificationService.createNotification(
                    ticket.getReportedBy(),
                    "Ticket Deleted",
                    "Your ticket " + ticketId + " was deleted by an administrator.",
                    "TICKET"
            );
        }
    }

    public List<User> getAvailableTechnicians() {
        return userRepository.findByRoleAndAvailableTrue(Role.TECHNICIAN);
    }

    private boolean isValidTransition(TicketStatus current, TicketStatus next) {
        return switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED;
            case IN_PROGRESS -> next == TicketStatus.CLOSED || next == TicketStatus.REJECTED;
            case RESOLVED -> next == TicketStatus.CLOSED;
            case CLOSED, REJECTED -> false;
        };
    }

    /**
     * Create a system-generated comment on a ticket for audit trail.
     */
    private void createSystemComment(String ticketId, String userId, String message) {
        String now = Instant.now().toString();
        Comment comment = Comment.builder()
                .ticketId(ticketId)
                .userId(userId)
                .message(message)
                .createdAt(now)
                .updatedAt(now)
                .systemGenerated(true)
                .build();
        commentRepository.save(comment);
    }

    /**
     * Set a technician's availability status.
     */
    private void setTechnicianAvailability(String userId, boolean available) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getRole() == Role.TECHNICIAN) {
                user.setAvailable(available);
                userRepository.save(user);
            }
        });
    }

    /**
     * Resolve a user ID to a display name (name or email).
     */
    private String resolveUserName(String userId) {
        return userRepository.findById(userId)
                .map(user -> user.getName() != null && !user.getName().isBlank()
                        ? user.getName() : user.getEmail())
                .orElse("Unknown Technician");
    }

    /**
     * Send a notification to all admin users.
     */
    private void notifyAllAdmins(String title, String message, String type) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(admin.getId(), title, message, type);
        }
    }
}
