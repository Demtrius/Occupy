import { validateUser } from "@/schemas/user";
import type { User } from "@/types/user";
import { apiFetch } from "./client";

export async function getMe(): Promise<User> {
	const data = await apiFetch("/api/v1/users/me");
	return validateUser(data);
}
