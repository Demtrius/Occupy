import { api } from "@/lib/api-client";
import type { MediaCreate } from "@/types/media";

export async function presignUpload(
	mime: string,
	sizeBytes: number,
	purpose: string,
): Promise<{
	uploadUrl: string;
	fields: Record<string, string>;
	expiresIn: number;
}> {
	const response = await api.post("/api/v1/media/uploads/presign", null, {
		params: { mime, sizeBytes, purpose },
	});
	return response.data as {
		uploadUrl: string;
		fields: Record<string, string>;
		expiresIn: number;
	};
}

export async function registerUploaded(
	body: MediaCreate,
): Promise<{ mediaId: string }> {
	const response = await api.post("/api/v1/media", body);
	return response.data as { mediaId: string };
}
