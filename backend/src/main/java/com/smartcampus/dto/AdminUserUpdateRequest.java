package com.smartcampus.dto;

public record AdminUserUpdateRequest(
        String name,
        String email,
        String role,
        String password
) {
}
