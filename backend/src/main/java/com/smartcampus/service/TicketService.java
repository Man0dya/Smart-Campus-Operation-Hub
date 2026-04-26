package com.smartcampus.service;

import com.smartcampus.dto.TicketCreateRequest;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.SkillCategory;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Skill;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final TicketAttachmentStorageService ticketAttachmentStorageService;

    public TicketService(TicketRepository ticketRepository,
                         NotificationService notificationService,
                         CommentRepository commentRepository,
                         UserRepository userRepository,
                         TicketAttachmentStorageService ticketAttachmentStorageService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.ticketAttachmentStorageService = ticketAttachmentStorageService;
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

        if (actor.getRole() == Role.TECHNICIAN) {
            if (!isAssignedTo(ticket, actor.getId())) {
                throw new ForbiddenOperationException("Technician can only update tickets assigned to them.");
            }

            if (!isBlank(assignedTo)) {
                throw new ForbiddenOperationException("Technician cannot reassign tickets.");
            }

            if (!(ticket.getStatus() == TicketStatus.IN_PROGRESS && status == TicketStatus.RESOLVED)) {
                throw new ConflictException("Technician can only resolve an assigned IN_PROGRESS ticket.");
            }
        }

        if (actor.getRole() == Role.ADMIN) {
            if (!isBlank(assignedTo) && status != TicketStatus.IN_PROGRESS && status != TicketStatus.ASSIGNED) {
                throw new IllegalArgumentException("Technician assignment is only allowed when status is ASSIGNED or IN_PROGRESS.");
            }

            String effectiveAssignedTo = !isBlank(assignedTo) ? assignedTo.trim() : ticket.getAssignedTo();
            if (status == TicketStatus.ASSIGNED && isBlank(effectiveAssignedTo)) {
                throw new IllegalArgumentException("Admin must assign a technician when setting status to ASSIGNED.");
            }

            if (status == TicketStatus.OPEN) {
                assignedTo = null; // Clear assignee if moving back to OPEN
                ticket.setAssignedTo(null);
            }

            if (!isBlank(assignedTo)) {
                validateTechnicianAssignee(assignedTo.trim());
            }
        }

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
        String previousAssignedTo = ticket.getAssignedTo();

        ticket.setStatus(status);

        if (status == TicketStatus.OPEN) {
            ticket.setAssignedTo(null);
            assignedTo = null;
        } else if (!isBlank(assignedTo)) {
            ticket.setAssignedTo(assignedTo.trim());
        }

        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes.trim());
        }

        String now = Instant.now().toString();
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(actor.getId());

        Ticket saved = ticketRepository.save(ticket);

        // Free up technician availability if they are unassigned
        if (status == TicketStatus.OPEN && previousAssignedTo != null) {
            setTechnicianAvailability(previousAssignedTo, true);
        }

        // ---- Notification & auto-comment pipeline based on transition ----
        handleStatusTransitionEffects(saved, previousStatus, status, assignedTo, resolutionNotes, actor);

        return saved;
    }

    public Ticket cancelTicket(String ticketId, User actor) {
        if (actor == null) {
            throw new ForbiddenOperationException("Authentication required.");
        }

        if (actor.getRole() == Role.TECHNICIAN) {
            throw new ForbiddenOperationException("Technicians cannot cancel tickets.");
        }

        Ticket ticket = getTicketById(ticketId);

        boolean actorIsAdminOrTech = actor.getRole() == Role.ADMIN || actor.getRole() == Role.TECHNICIAN;
        ensureTicketAccess(ticket, actor, actorIsAdminOrTech);

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ConflictException("Only OPEN tickets can be cancelled.");
        }

        TicketStatus previousStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.CANCELLED);

        String now = Instant.now().toString();
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(actor.getId());

        Ticket saved = ticketRepository.save(ticket);

        String actorName = actor.getName() != null ? actor.getName() : actor.getEmail();
        String ticketRef = "#" + saved.getId();

        createSystemComment(saved.getId(), "SYSTEM",
                "\u26D4 Ticket cancelled by " + actorName + ".");

        notifyAllAdmins("Ticket Cancelled",
                "Ticket " + ticketRef + " was cancelled by the reporter.",
                "TICKET");

        // Keep side-effects predictable: do not route through workflow transition handler.
        // This is a reporter-driven action, not part of admin/technician lifecycle updates.
        if (previousStatus == TicketStatus.IN_PROGRESS && saved.getAssignedTo() != null) {
            setTechnicianAvailability(saved.getAssignedTo(), true);
        }

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
            case OPEN -> {
                if (from == TicketStatus.ASSIGNED || from == TicketStatus.IN_PROGRESS) {
                    // ticket.getAssignedTo() might be null now because we cleared it. But wait, we should clear it AFTER this if we need it here, or use the 'assignedTo' passed in...
                    // In updateTicketStatus, ticket.setAssignedTo(null) was already called. 
                    // However, we don't have the old assignee ID easily. Let's just create a system comment.
                    // Actually, let's just make sure the system comment is there.
                    createSystemComment(ticket.getId(), "SYSTEM", "Ticket returned to OPEN by " + actorName + ".");
                }
            }

            case ASSIGNED -> {
                if (assignedTo != null && !assignedTo.isBlank()) {
                    String techName = resolveUserName(assignedTo);
                    setTechnicianAvailability(assignedTo, false);
                    notificationService.createNotification(assignedTo, "New Ticket Assigned", "You have been assigned to ticket " + ticketRef + ". Please accept or reject it.", "TICKET");
                    notificationService.createNotification(ticket.getReportedBy(), "Ticket Assigned", "Your ticket " + ticketRef + " has been assigned to technician " + techName + " and is pending acceptance.", "TICKET");
                    createSystemComment(ticket.getId(), "SYSTEM", "🔧 Ticket assigned to " + techName + " by " + actorName + " and is pending acceptance.");
                }
            }

            case IN_PROGRESS -> {
                // Technician accepted the ticket
                notificationService.createNotification(ticket.getReportedBy(), "Ticket In Progress", "Your ticket " + ticketRef + " has been accepted and is now being worked on.", "TICKET");
                createSystemComment(ticket.getId(), "SYSTEM", "⚙️ Ticket accepted. Status changed to IN_PROGRESS by " + actorName + ".");
            }

            case RESOLVED -> {
                // Technician marks ticket as resolved
                String notes = (resolutionNotes != null && !resolutionNotes.isBlank())
                        ? resolutionNotes.trim() : "";

                // Notify the reporter
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        "Ticket Resolved",
                        "Your ticket " + ticketRef + " has been resolved by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes),
                        "TICKET"
                );

                // Notify all admins
                notifyAllAdmins("Ticket Resolved",
                        "Ticket " + ticketRef + " has been resolved by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes),
                        "TICKET");

                // System comment on the ticket
                createSystemComment(ticket.getId(), "SYSTEM",
                        "✅ Issue marked as RESOLVED by " + actorName + "."
                                + (notes.isEmpty() ? "" : " Resolution: " + notes));
            }

            case CLOSED -> {
                // Admin marks ticket as CLOSED
                // Mark technician as available again
                if (ticket.getAssignedTo() != null) {
                    setTechnicianAvailability(ticket.getAssignedTo(), true);
                }

                // Notify the reporter
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        "Ticket Closed",
                        "Your ticket " + ticketRef + " has been verified and closed by " + actorName + ".",
                        "TICKET"
                );

                // System comment on the ticket
                createSystemComment(ticket.getId(), "SYSTEM",
                        "🔒 Ticket closed by " + actorName + ".");
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

    public Ticket addTechnicianResponse(String id, String response, User actor, boolean actorIsAdminOrTech) {
        if (!actorIsAdminOrTech) {
            throw new ForbiddenOperationException("Only admin or technician can add a ticket response.");
        }

        Ticket ticket = getTicketById(id);

        if (actor.getRole() == Role.TECHNICIAN && !isAssignedTo(ticket, actor.getId())) {
            throw new ForbiddenOperationException("Technician can only respond to tickets assigned to them.");
        }

        if (response == null || response.isBlank()) {
            throw new IllegalArgumentException("Response text is required.");
        }

        ticket.setTechnicianResponse(response.trim());
        ticket.setUpdatedAt(Instant.now().toString());

        Ticket saved = ticketRepository.save(ticket);

        String actorName = actor.getName() != null && !actor.getName().isBlank() ? actor.getName() : actor.getEmail();
        createSystemComment(ticket.getId(), "SYSTEM",
                "🗨️ Technician response added by " + actorName + ".");

        notificationService.createNotification(
                ticket.getReportedBy(),
                "Ticket Response Updated",
                "Your ticket #" + ticket.getId() + " has a new response from the technician.",
                "TICKET"
        );

        return saved;
    }

    public void ensureTicketAccess(Ticket ticket, User actor, boolean actorIsAdminOrTech) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        if (actor.getRole() == Role.TECHNICIAN) {
            if (!isAssignedTo(ticket, actor.getId())) {
                throw new ForbiddenOperationException("Technicians can only access tickets assigned to them.");
            }
            return;
        }

        if (!ticket.getReportedBy().equals(actor.getId())) {
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

        // Best-effort cleanup for Cloudinary-backed attachments.
        ticketAttachmentStorageService.deleteAttachments(ticket.getAttachments());

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
        Set<String> busyTechnicianIds = ticketRepository.findAll().stream()
            .filter(t -> (t.getStatus() == TicketStatus.IN_PROGRESS || t.getStatus() == TicketStatus.ASSIGNED) && t.getAssignedTo() != null)
            .map(Ticket::getAssignedTo)
            .collect(Collectors.toSet());

        return userRepository.findByRole(Role.TECHNICIAN).stream()
            .filter(User::isAvailable)
            .filter(technician -> !busyTechnicianIds.contains(technician.getId()))
            .toList();
    }

    public List<User> getAvailableTechniciansForCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return getAvailableTechnicians();
        }

        Set<String> busyTechnicianIds = ticketRepository.findAll().stream()
            .filter(t -> (t.getStatus() == TicketStatus.IN_PROGRESS || t.getStatus() == TicketStatus.ASSIGNED) && t.getAssignedTo() != null)
            .map(Ticket::getAssignedTo)
            .collect(Collectors.toSet());

        return userRepository.findByRole(Role.TECHNICIAN).stream()
            .filter(User::isAvailable)
            .filter(technician -> !busyTechnicianIds.contains(technician.getId()))
            .sorted((t1, t2) -> Integer.compare(getSkillScore(t2, category.trim()), getSkillScore(t1, category.trim())))
            .toList();
    }

    private boolean hasMatchingSkillForCategory(User technician, String category) {
        if (technician.getSkills() == null) return false;

        try {
            SkillCategory skillCategory = SkillCategory.valueOf(category.toUpperCase().replace(" ", "_"));
            return technician.getSkills().stream()
                .anyMatch(skill -> skill.getCategory() == skillCategory && skill.isVerified());
        } catch (IllegalArgumentException e) {
            // If category doesn't match enum, try partial matching
            return technician.getSkills().stream()
                .anyMatch(skill -> skill.getCategory() != null &&
                                  skill.getCategory().name().toLowerCase().contains(category.toLowerCase()) &&
                                  skill.isVerified());
        }
    }

    private int getSkillScore(User technician, String category) {
        if (technician.getSkills() == null) return 0;

        try {
            SkillCategory skillCategory = SkillCategory.valueOf(category.toUpperCase().replace(" ", "_"));
            return technician.getSkills().stream()
                .filter(skill -> skill.getCategory() == skillCategory)
                .filter(Skill::isVerified)
                .mapToInt(skill -> switch (skill.getLevel()) {
                    case BEGINNER -> 1;
                    case INTERMEDIATE -> 2;
                    case ADVANCED -> 3;
                    case EXPERT -> 4;
                })
                .max()
                .orElse(0);
        } catch (IllegalArgumentException e) {
            return technician.getSkills().stream()
                .filter(skill -> skill.getCategory() != null &&
                                skill.getCategory().name().toLowerCase().contains(category.toLowerCase()))
                .filter(Skill::isVerified)
                .mapToInt(skill -> switch (skill.getLevel()) {
                    case BEGINNER -> 1;
                    case INTERMEDIATE -> 2;
                    case ADVANCED -> 3;
                    case EXPERT -> 4;
                })
                .max()
                .orElse(0);
        }
    }

    private boolean isValidTransition(TicketStatus current, TicketStatus next) {
        return switch (current) {
            case OPEN -> next == TicketStatus.ASSIGNED || next == TicketStatus.REJECTED;
            case ASSIGNED -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.OPEN || next == TicketStatus.REJECTED;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED;
            case RESOLVED -> next == TicketStatus.CLOSED;
            case CLOSED, REJECTED, CANCELLED -> false;
        };
    }

    private void validateTechnicianAssignee(String assignedToUserId) {
        User assignee = userRepository.findById(assignedToUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Assigned technician not found."));

        if (assignee.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("assignedTo must reference a technician user.");
        }
    }

    private boolean isAssignedTo(Ticket ticket, String userId) {
        return ticket.getAssignedTo() != null && ticket.getAssignedTo().equals(userId);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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
        if (admins == null || admins.isEmpty()) {
            return;
        }
        for (User admin : admins) {
            notificationService.createNotification(admin.getId(), title, message, type);
        }
    }

    public Ticket acceptTicket(String ticketId, User technician) {
        Ticket ticket = getTicketById(ticketId);
        if (ticket.getStatus() != TicketStatus.ASSIGNED) {
            throw new ConflictException("Ticket is not in ASSIGNED state.");
        }
        if (!technician.getId().equals(ticket.getAssignedTo())) {
            throw new ForbiddenOperationException("Only the assigned technician can accept this ticket.");
        }
        
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        String now = Instant.now().toString();
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(technician.getId());
        
        Ticket saved = ticketRepository.save(ticket);
        
        createSystemComment(saved.getId(), "SYSTEM", "✅ Technician accepted the ticket. Status changed to IN_PROGRESS.");
        notificationService.createNotification(ticket.getReportedBy(), "Ticket In Progress", "Your ticket has been accepted by the technician and is now in progress.", "TICKET");
        
        return saved;
    }

    public Ticket rejectTicketAssignment(String ticketId, String reason, User technician) {
        Ticket ticket = getTicketById(ticketId);
        if (ticket.getStatus() != TicketStatus.ASSIGNED) {
            throw new ConflictException("Ticket is not in ASSIGNED state.");
        }
        if (!technician.getId().equals(ticket.getAssignedTo())) {
            throw new ForbiddenOperationException("Only the assigned technician can reject this ticket.");
        }
        
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setAssignedTo(null);
        String now = Instant.now().toString();
        ticket.setUpdatedAt(now);
        ticket.setStatusChangedAt(now);
        ticket.setStatusChangedBy(technician.getId());
        
        Ticket saved = ticketRepository.save(ticket);
        
        notifyAllAdmins("Technician Rejected Ticket", "Technician rejected ticket #" + ticketId + " with reason: " + reason, "TICKET");
        createSystemComment(saved.getId(), "SYSTEM", "❌ Technician rejected the assignment. Reason: " + reason + ". Ticket returned to OPEN.");
        
        setTechnicianAvailability(technician.getId(), true);
        
        return saved;
    }
}
