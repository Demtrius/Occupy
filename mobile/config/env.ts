/**
 * Environment Configuration
 *
 * Centralized configuration for environment variables with type safety.
 * This ensures all environment variables are properly typed and validated.
 */

interface EnvironmentConfig {
	BACKEND_URL: string;
	API_TIMEOUT: number;
	ENV: "development" | "staging" | "production";
	DEBUG: boolean;
}

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: string, defaultValue?: string): string {
	const value = process.env[`EXPO_PUBLIC_${key}`] || defaultValue;

	if (!value) {
		console.warn(`Environment variable EXPO_PUBLIC_${key} is not set`);
		return "";
	}

	return value;
}

/**
 * Parse boolean environment variable
 */
function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
	const value = getEnvVar(key);
	if (!value) return defaultValue;
	return value.toLowerCase() === "true" || value === "1";
}

/**
 * Parse number environment variable
 */
function getNumberEnv(key: string, defaultValue: number): number {
	const value = getEnvVar(key);
	if (!value) return defaultValue;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Determine current environment
 */
function getEnvironment(): "development" | "staging" | "production" {
	const env = getEnvVar("ENV", "development").toLowerCase();

	if (env === "production" || env === "prod") {
		return "production";
	}

	if (env === "staging" || env === "stage") {
		return "staging";
	}

	return "development";
}

/**
 * Main environment configuration object
 */
const env: EnvironmentConfig = {
	// Backend API URL
	BACKEND_URL: getEnvVar("BACKEND_URL", "http://localhost:8000"),

	// API request timeout in milliseconds
	API_TIMEOUT: getNumberEnv("API_TIMEOUT", 15000),

	// Current environment
	ENV: getEnvironment(),

	// Debug mode
	DEBUG: getBooleanEnv("DEBUG", __DEV__),
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
	const requiredVars: (keyof EnvironmentConfig)[] = ["BACKEND_URL"];

	const missingVars = requiredVars.filter((key) => !env[key]);

	if (missingVars.length > 0) {
		console.error(
			"Missing required environment variables:",
			missingVars.join(", "),
		);

		if (env.ENV === "production") {
			throw new Error(
				`Missing required environment variables: ${missingVars.join(", ")}`,
			);
		}
	}
}

/**
 * Log current configuration (development only)
 */
export function logEnvConfig(): void {
	if (env.DEBUG && __DEV__) {
		console.log("=== Environment Configuration ===");
		console.log("Environment:", env.ENV);
		console.log("Backend URL:", env.BACKEND_URL);
		console.log("API Timeout:", env.API_TIMEOUT);
		console.log("Debug Mode:", env.DEBUG);
		console.log("================================");
	}
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
	return env.ENV === "development";
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
	return env.ENV === "production";
}

/**
 * Check if running in staging mode
 */
export function isStaging(): boolean {
	return env.ENV === "staging";
}

// Validate on import
validateEnv();

// Export configuration
export default env;

// Export individual values for convenience
export const { BACKEND_URL, API_TIMEOUT, ENV, DEBUG } = env;
