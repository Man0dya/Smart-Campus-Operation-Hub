package com.smartcampus.service;

import com.smartcampus.dto.TicketCreateRequest;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
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
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getMyTickets(String reportedByUserId) {
        return ticketRepository.findByReportedBy(reportedByUserId);
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

        if (ticket.getStatus() == status) {
            return ticket;
        }

        if (!isValidTransition(ticket.getStatus(), status)) {
            throw new ConflictException("Invalid ticket status transition from " + ticket.getStatus() + " to " + status + ".");
        }

        if (status == TicketStatus.REJECTED && (resolutionNotes == null || resolutionNotes.isBlank())) {
            throw new IllegalArgumentException("A rejection reason is required when setting status to REJECTED.");
        }

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

        notificationService.createNotification(
                saved.getReportedBy(),
                "Ticket " + saved.getStatus(),
                "Your ticket " + saved.getId() + " is now " + saved.getStatus() + ".",
                "TICKET"
        );

        return saved;
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

    private boolean isValidTransition(TicketStatus current, TicketStatus next) {
        return switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS || next == TicketStatus.REJECTED;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED || next == TicketStatus.REJECTED;
            case RESOLVED -> next == TicketStatus.CLOSED;
            case CLOSED, REJECTED -> false;
        };
    }
}
