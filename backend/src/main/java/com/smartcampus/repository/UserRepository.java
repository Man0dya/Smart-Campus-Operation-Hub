package com.smartcampus.repository;

import com.smartcampus.enums.Role;
import com.smartcampus.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByRoleAndAvailableTrue(Role role);
    List<User> findByRole(Role role);
}