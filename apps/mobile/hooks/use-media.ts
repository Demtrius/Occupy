import { useMutation, useQuery } from "@tanstack/react-query";
import type { RequestOptions } from "openapi-fetch";
import { $api, ensureData } from "@/lib/api";
import type { operations } from "@/types/generated";

type PresignVariables = RequestOptions<operations["MediaUploadsPresign"]>;
type RegisterVariables = RequestOptions<operations["MediaRegister"]>;

export function usePresignUploadMutation() {
	return useMutation({
		mutationFn: async (variables: PresignVariables) =>
			ensureData(await $api.POST("/api/v1/media/uploads/presign", variables)),
	});
}

export function useRegisterUploadedMutation() {
	return useMutation({
		mutationFn: async (variables: RegisterVariables) =>
			ensureData(await $api.POST("/api/v1/media", variables)),
	});
}

// Note: Since there's no GET /api/v1/media/{id} endpoint, we'll need to 
// either add it to the backend or include media info in the message response
// For now, this is a placeholder that would need the backend endpoint
export function useMediaQuery(mediaId: string | undefined | null) {
	return useQuery({
		queryKey: ["media", mediaId],
		queryFn: async () => {
			if (!mediaId) return null;
			// This endpoint doesn't exist yet - would need to be added to backend
			// return ensureData(await $api.GET("/api/v1/media/{mediaId}", { params: { path: { mediaId } } }));
			return null;
		},
		enabled: !!mediaId,
		staleTime: Infinity, // Media URLs don't change
	});
}
