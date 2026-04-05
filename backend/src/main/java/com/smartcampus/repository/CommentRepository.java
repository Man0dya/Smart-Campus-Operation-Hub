package com.smartcampus.repository;

import com.smartcampus.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTicketIdOrderByCreatedAtAsc(String ticketId);
    Optional<Comment> findByIdAndUserId(String id, String userId);
}
