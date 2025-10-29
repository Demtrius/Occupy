import { useMutation } from "@tanstack/react-query";
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
