/**
 * Utility functions for transforming API responses from snake_case to camelCase
 */

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
function camelToSnake(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transform object keys from snake_case to camelCase
 */
export function transformKeysToCamel(obj: any): any {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(transformKeysToCamel);
	}

	if (typeof obj === "object") {
		const transformed: any = {};
		for (const [key, value] of Object.entries(obj)) {
			let camelKey = snakeToCamel(key);

			// Handle specific field name mappings
			if (camelKey === "created") {
				camelKey = "createdAt";
			} else if (camelKey === "modified") {
				camelKey = "updatedAt";
			}

			transformed[camelKey] = transformKeysToCamel(value);
		}
		return transformed;
	}

	return obj;
}

/**
 * Recursively transform object keys from camelCase to snake_case
 */
export function transformKeysToSnake(obj: any): any {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(transformKeysToSnake);
	}

	if (typeof obj === "object") {
		const transformed: any = {};
		for (const [key, value] of Object.entries(obj)) {
			const snakeKey = camelToSnake(key);
			transformed[snakeKey] = transformKeysToSnake(value);
		}
		return transformed;
	}

	return obj;
}

/**
 * Transform API response data from snake_case to camelCase
 */
export function transformResponse<T = any>(data: any): T {
	return transformKeysToCamel(data) as T;
}

/**
 * Transform request data from camelCase to snake_case
 */
export function transformRequest(data: any): any {
	return transformKeysToSnake(data);
}
