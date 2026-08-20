package com.example.identityservice.constants;

/**
 * Application constants for HTTP headers, JWT prefix, and default pagination settings.
 */
public class AppConstants {
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "10";
    public static final String DEFAULT_SORT_BY = "createdAt";
    public static final String DEFAULT_SORT_DIRECTION = "desc";
    
    private AppConstants() {
        // Private constructor to prevent instantiation
    }
}

