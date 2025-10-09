/**
 * Platform-aware storage utility
 *
 * Uses SecureStore for native platforms (iOS/Android) and AsyncStorage for web.
 * Provides a unified API for storing sensitive data across all platforms.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const IS_WEB = Platform.OS === "web";

/**
 * Storage utility that automatically uses the correct storage mechanism
 * based on the platform (SecureStore for native, AsyncStorage for web)
 */
export const storage = {
	/**
	 * Get an item from storage
	 *
	 * @param key - The key to retrieve
	 * @returns The stored value or null if not found
	 *
	 * @example
	 * const token = await storage.getItem('access_token');
	 */
	async getItem(key: string): Promise<string | null> {
		try {
			if (IS_WEB) {
				return await AsyncStorage.getItem(key);
			}
			return await SecureStore.getItemAsync(key);
		} catch (error) {
			console.error(`Error getting item "${key}" from storage:`, error);
			return null;
		}
	},

	/**
	 * Set an item in secure storage
	 *
	 * @param key - The key to store under
	 * @param value - The value to store
	 *
	 * @example
	 * await storage.setItem('access_token', token);
	 */
	async setItem(key: string, value: string): Promise<void> {
		try {
			if (IS_WEB) {
				await AsyncStorage.setItem(key, value);
			} else {
				await SecureStore.setItemAsync(key, value);
			}
		} catch (error) {
			console.error(`Error setting item "${key}" in storage:`, error);
			throw error;
		}
	},

	/**
	 * Remove an item from secure storage
	 *
	 * @param key - The key to remove
	 *
	 * @example
	 * await storage.removeItem('access_token');
	 */
	async removeItem(key: string): Promise<void> {
		try {
			if (IS_WEB) {
				await AsyncStorage.removeItem(key);
			} else {
				await SecureStore.deleteItemAsync(key);
			}
		} catch (error) {
			console.error(`Error removing item "${key}" from storage:`, error);
			throw error;
		}
	},

	/**
	 * Get multiple items from storage
	 *
	 * @param keys - Array of keys to retrieve
	 * @returns Object with key-value pairs
	 *
	 * @example
	 * const { access_token, refresh_token } = await storage.getMultiple([
	 *   'access_token',
	 *   'refresh_token'
	 * ]);
	 */
	async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
		try {
			const result: Record<string, string | null> = {};

			if (IS_WEB) {
				const values = await AsyncStorage.multiGet(keys);
				values.forEach(([key, value]) => {
					result[key] = value;
				});
			} else {
				// SecureStore doesn't have multiGet, so we do it sequentially
				for (const key of keys) {
					result[key] = await SecureStore.getItemAsync(key);
				}
			}

			return result;
		} catch (error) {
			console.error("Error getting multiple items from storage:", error);
			throw error;
		}
	},

	/**
	 * Set multiple items in storage
	 *
	 * @param items - Array of [key, value] pairs to store
	 *
	 * @example
	 * await storage.setMultiple([
	 *   ['access_token', accessToken],
	 *   ['refresh_token', refreshToken]
	 * ]);
	 */
	async setMultiple(items: Array<[string, string]>): Promise<void> {
		try {
			if (IS_WEB) {
				await AsyncStorage.multiSet(items);
			} else {
				// SecureStore doesn't have multiSet, so we do it sequentially
				for (const [key, value] of items) {
					await SecureStore.setItemAsync(key, value);
				}
			}
		} catch (error) {
			console.error("Error setting multiple items in storage:", error);
			throw error;
		}
	},

	/**
	 * Remove multiple items from storage
	 *
	 * @param keys - Array of keys to remove
	 *
	 * @example
	 * await storage.removeMultiple(['access_token', 'refresh_token']);
	 */
	async removeMultiple(keys: string[]): Promise<void> {
		try {
			if (IS_WEB) {
				await AsyncStorage.multiRemove(keys);
			} else {
				// SecureStore doesn't have multiRemove, so we do it sequentially
				for (const key of keys) {
					await SecureStore.deleteItemAsync(key);
				}
			}
		} catch (error) {
			console.error("Error removing multiple items from storage:", error);
			throw error;
		}
	},

	/**
	 * Clear all items from storage
	 *
	 * @example
	 * await storage.clear();
	 */
	async clear(): Promise<void> {
		try {
			if (IS_WEB) {
				await AsyncStorage.clear();
			} else {
				console.warn(
					"SecureStore does not support clearing all keys. Items must be removed individually.",
				);
			}
		} catch (error) {
			console.error("Error clearing storage:", error);
			throw error;
		}
	},

	/**
	 * Get all keys from storage
	 *
	 * @returns Array of all keys (web only, returns empty array on native)
	 *
	 * @example
	 * const keys = await storage.getAllKeys();
	 */
	async getAllKeys(): Promise<string[]> {
		try {
			if (IS_WEB) {
				return (await AsyncStorage.getAllKeys()) as string[];
			} else {
				console.warn("SecureStore does not support getting all keys.");
				return [];
			}
		} catch (error) {
			console.error("Error getting all keys from storage:", error);
			return [];
		}
	},

	/**
	 * Check if a key exists in storage
	 *
	 * @param key - The key to check
	 * @returns True if the key exists, false otherwise
	 *
	 * @example
	 * const hasToken = await storage.hasItem('access_token');
	 */
	async hasItem(key: string): Promise<boolean> {
		try {
			const value = await this.getItem(key);
			return value !== null;
		} catch (error) {
			console.error(`Error checking if item "${key}" exists:`, error);
			return false;
		}
	},

	/**
	 * Get platform information
	 *
	 * @returns Object with platform details
	 */
	getPlatformInfo() {
		return {
			platform: Platform.OS,
			isWeb: IS_WEB,
			isNative: !IS_WEB,
			storageType: IS_WEB ? "AsyncStorage" : "SecureStore",
		};
	},
};

export default storage;
