import { useCallback, useMemo } from "react";
import {
	PostForm,
	type PostFormSubmitPayload,
	type SelectedMedia,
} from "@/components/clique/forms/post-form";
import { AppModal } from "@/components/ui/modal";
import {
	useCreatePostMutation,
	useUpdatePostMutation,
} from "@/hooks/use-posts";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Post } from "@/types";
import { ContentFormat, PostStatus } from "@/types/generated";

interface CreatePostModalProps {
	visible: boolean;
	cliqueId: string;
	mode?: "create" | "edit";
	post?: Post | null;
	onClose: () => void;
	onCreated?: (post: Post) => void;
	onUpdated?: (post: Post) => void;
}

export function CreatePostModal({
	visible,
	cliqueId,
	mode = "create",
	post,
	onClose,
	onCreated,
	onUpdated,
}: CreatePostModalProps) {
	const isEditMode = mode === "edit" || Boolean(post);
	const modalTitle = isEditMode ? "Edit Post" : "Create Post";
	const submitLabel = isEditMode ? "Save Changes" : "Post";

	const createPostMutation = useCreatePostMutation();
	const updatePostMutation = useUpdatePostMutation();

	const isSubmitting =
		createPostMutation.isPending || updatePostMutation.isPending;

	const initialContent = post?.content ?? "";
	const initialMedia = useMemo<SelectedMedia[]>(() => {
		if (!post?.media || post.media.length === 0) return [];
		return post.media.map((item) => ({
			tempId: item.id ?? item.mediaId ?? Math.random().toString(36),
			status: "uploaded",
			mediaId: item.mediaId,
			remoteUrl: item.media?.url,
			mimeType: item.media?.mime ?? "image/jpeg",
		}));
	}, [post]);

	const handleSubmit = useCallback(
		async (values: PostFormSubmitPayload) => {
			if (isEditMode && post) {
				try {
					const updated = await updatePostMutation.mutateAsync({
						params: {
							path: { postId: post.id },
						},
						body: {
							content: values.content,
							status: post.status ?? PostStatus.posted,
						},
					});
					showToast({ type: "success", message: "Post updated" });
					onUpdated?.(updated);
					onClose();
				} catch (error: unknown) {
					showToast({
						type: "error",
						message: getErrorMessage(error, "Failed to update post"),
					});
				}
				return;
			}

			if (!cliqueId) {
				showToast({ type: "error", message: "Missing clique context." });
				return;
			}

			try {
				const created = await createPostMutation.mutateAsync({
					params: {
						path: { cliqueId },
					},
					body: {
						content: values.content,
						contentFormat: ContentFormat.markdown,
						status: PostStatus.posted,
						mediaIds: values.mediaIds,
					},
				});
				showToast({ type: "success", message: "Post published" });
				onCreated?.(created);
				onClose();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to publish post"),
				});
			}
		},
		[
			cliqueId,
			createPostMutation,
			isEditMode,
			onClose,
			onCreated,
			onUpdated,
			post,
			updatePostMutation,
		],
	);

	return (
		<AppModal visible={visible} onClose={onClose} title={modalTitle}>
			<PostForm
				initialContent={initialContent}
				initialMedia={initialMedia}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				submitLabel={submitLabel}
				allowMediaEditing={!isEditMode}
			/>
		</AppModal>
	);
}
