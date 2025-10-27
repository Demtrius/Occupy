import { $api } from "@/lib/api";

export function usePresignUploadMutation() {
	return $api.useMutation("post", "/api/v1/media/uploads/presign");
}

export function useRegisterUploadedMutation() {
	return $api.useMutation("post", "/api/v1/media");
}
