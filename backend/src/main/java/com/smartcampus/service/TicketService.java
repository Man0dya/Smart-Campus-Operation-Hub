package com.smartcampus.service;

import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Attachment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
    }

    public Ticket createTicket(Ticket ticket) {
        if (ticket.getDescription() == null || ticket.getDescription().isBlank()) {
            throw new IllegalArgumentException("Ticket description is required.");
        }

        if (ticket.getAttachments() != null && ticket.getAttachments().size() > 3) {
            throw new IllegalArgumentException("A maximum of 3 attachments is allowed.");
        }

        ticket.setStatus(TicketStatus.OPEN);
        ticket.setResolutionNotes(null);
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
        ticket.setStatus(status);

        if (assignedTo != null && !assignedTo.isBlank()) {
            ticket.setAssignedTo(assignedTo);
        }

        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes);
        }

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
        return ticketRepository.save(ticket);
    }
}
