package com.smartcampus.service;

import com.smartcampus.exception.ForbiddenOperationException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          TicketRepository ticketRepository,
                          NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.notificationService = notificationService;
    }

    public List<Comment> getCommentsByTicket(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    public Comment createComment(String ticketId, String userId, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Comment message is required.");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        if (ticket.getStatus() == com.smartcampus.enums.TicketStatus.CLOSED) {
            throw new com.smartcampus.exception.ConflictException("Cannot add comments to a closed ticket.");
        }

        Comment comment = Comment.builder()
                .ticketId(ticketId)
                .userId(userId)
                .message(message)
                .createdAt(Instant.now().toString())
            .updatedAt(Instant.now().toString())
                .build();

        Comment saved = commentRepository.save(comment);

        if (ticket.getReportedBy() != null && !ticket.getReportedBy().equals(userId)) {
            notificationService.createNotification(
                    ticket.getReportedBy(),
                    "New Comment on Ticket",
                    "A new comment was added to your ticket " + ticket.getId() + ".",
                    "COMMENT"
            );
        }

        if (ticket.getAssignedTo() != null && !ticket.getAssignedTo().equals(userId)) {
            notificationService.createNotification(
                    ticket.getAssignedTo(),
                    "New Ticket Comment",
                    "A new comment was added to assigned ticket " + ticket.getId() + ".",
                    "COMMENT"
            );
        }

        return saved;
    }

    public Comment updateOwnComment(String commentId, String userId, String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Comment message is required.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("You can only update your own comments.");
        }

        Ticket ticket = ticketRepository.findById(comment.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found."));

        if (ticket.getStatus() == com.smartcampus.enums.TicketStatus.CLOSED) {
            throw new com.smartcampus.exception.ConflictException("Cannot update comments on a closed ticket.");
        }

        comment.setMessage(message);
        comment.setUpdatedAt(Instant.now().toString());
        return commentRepository.save(comment);
    }

    public void deleteOwnComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        if (!comment.getUserId().equals(userId)) {
            throw new ForbiddenOperationException("You can only delete your own comments.");
        }

        Ticket ticket = ticketRepository.findById(comment.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found."));

        if (ticket.getStatus() == com.smartcampus.enums.TicketStatus.CLOSED) {
            throw new com.smartcampus.exception.ConflictException("Cannot delete comments from a closed ticket.");
        }

        commentRepository.delete(comment);
    }
}
