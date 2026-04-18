package com.smartcampus.dto;

public record AdminUserCreateRequest(
        String name,
        String email,
        String role,
        String password
) {
}
