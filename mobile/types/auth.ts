// Authentication Types

/**
 * JWT token pair returned by authentication endpoints
 */
export interface AuthTokens {
	access: string;
	refresh: string;
}

/**
 * Login credentials - can use email or username
 */
export interface LoginCredentials {
	email?: string;
	username?: string;
	password: string;
}

/**
 * User registration data
 * All fields are required for account creation
 */
export interface RegisterData {
	/** Unique username (3-30 characters, alphanumeric and underscores) */
	username: string;
	/** Valid email address (must be unique) */
	email: string;
	/** Password (minimum 8 characters) */
	password: string;
	/** User's occupation or profession */
	occupations: string;
	/** Optional flag for business account registration */
	isBusinessPage?: boolean;
}

/**
 * Authentication response with tokens and user data
 */
export interface AuthResponse {
	access: string;
	refresh: string;
	user?: any;
}
