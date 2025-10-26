import { useMutation } from "@tanstack/react-query";
import * as media from "@/api/media";

export function usePresignUploadMutation() {
	return useMutation({
		mutationFn: ({
			mime,
			sizeBytes,
			purpose,
		}: {
			mime: string;
			sizeBytes: number;
			purpose: string;
		}) => media.presignUpload(mime, sizeBytes, purpose),
	});
}

export function useRegisterUploadedMutation() {
	return useMutation({
		mutationFn: media.registerUploaded,
	});
}
