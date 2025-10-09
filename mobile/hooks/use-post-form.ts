import { useCallback, useEffect } from "react";
import { useForm } from "./use-form";
import { useCliquesStore } from "../store/cliques.store";
import { postsService } from "../services";
import { showError, showSuccess } from "../store/app.store";
import type { CreatePostData } from "../types";

interface PostFormValues {
	caption: string;
	content: string;
	selectedCliqueId: number | null;
	selectedLanguage: string;
}

const initialValues: PostFormValues = {
	caption: "",
	content: "",
	selectedCliqueId: null,
	selectedLanguage: "ALL",
};

const validate = (values: PostFormValues) => {
	const errors: Partial<Record<keyof PostFormValues, string>> = {};
	if (!values.caption.trim()) {
		errors.caption = "Please enter post content";
	}
	if (!values.selectedCliqueId) {
		errors.selectedCliqueId = "Please select a clique";
	}
	return errors;
};

export function usePostForm() {
	const { cliques, fetchCliques } = useCliquesStore();

	const form = useForm(initialValues, validate);

	const handleSubmit = useCallback(async () => {
		await form.handleSubmit(async (values) => {
			try {
				const postData: CreatePostData = {
					content: values.content.trim() || values.caption.trim(),
					caption: values.caption.trim(),
					cliqueId: values.selectedCliqueId!,
				};
				await postsService.createPost(postData);
				showSuccess("Post created successfully");
				form.reset();
			} catch (error: any) {
				showError(error.message || "Failed to create post");
			}
		});
	}, [form]);

	useEffect(() => {
		fetchCliques();
	}, [fetchCliques]);

	const cliqueOptions = cliques.map((clique) => ({
		label: clique.name,
		value: clique.id,
	}));

	return {
		...form,
		handleSubmit,
		cliqueOptions,
	};
}

export default usePostForm;
