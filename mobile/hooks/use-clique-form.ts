import { useCallback } from "react";
import { useForm } from "./use-form";
import { useCliquesStore } from "../store/cliques.store";
import { showError, showSuccess } from "../store/app.store";
import type { CreateCliqueData } from "../types";

type Level = "PRIVATE" | "PUBLIC";

interface CliqueFormValues {
	name: string;
	description: string;
	occupation: string;
	level: Level;
}

const initialValues: CliqueFormValues = {
	name: "",
	description: "",
	occupation: "",
	level: "PUBLIC",
};

const validate = (values: CliqueFormValues) => {
	const errors: Partial<Record<keyof CliqueFormValues, string>> = {};
	if (!values.name.trim()) {
		errors.name = "Clique name is required";
	} else if (values.name.trim().length < 3) {
		errors.name = "Clique name must be at least 3 characters";
	}
	if (!values.occupation.trim()) {
		errors.occupation = "Occupation is required";
	} else if (values.occupation.trim().length < 2) {
		errors.occupation = "Occupation must be at least 2 characters";
	}
	if (!values.description.trim()) {
		errors.description = "Description is required";
	} else if (values.description.trim().length < 10) {
		errors.description = "Description must be at least 10 characters";
	}
	if (!values.level) {
		errors.level = "Please select a privacy level";
	}
	return errors;
};

export function useCliqueForm(onSuccess?: (clique: any) => void) {
	const { createClique } = useCliquesStore();
	const form = useForm(initialValues, validate);

	const handleSubmit = useCallback(async () => {
		await form.handleSubmit(async (values) => {
			try {
				const cliqueData: CreateCliqueData = {
					name: values.name.trim(),
					level: values.level,
					occupation: values.occupation.trim(),
					description: values.description.trim(),
				};
				const newClique = await createClique(cliqueData);
				showSuccess("Clique created successfully!");
				form.reset();
				onSuccess?.(newClique);
			} catch (error: any) {
				showError(error.message || "Failed to create clique");
			}
		});
	}, [form, createClique, onSuccess]);

	return {
		...form,
		handleSubmit,
	};
}

export default useCliqueForm;
