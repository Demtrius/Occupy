import { useCallback, useMemo } from "react";
import {
	CliqueForm,
	type CliqueFormSubmitPayload,
} from "@/components/clique/forms/clique-form";
import { AppModal } from "@/components/ui/modal";
import {
	useCreateCliqueMutation,
	useUpdateCliqueMutation,
} from "@/hooks/use-cliques";
import {
	useCreateOccupationMutation,
	useListOccupationsQuery,
} from "@/hooks/use-occupations";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Clique, Occupation } from "@/types";

interface CreateCliqueModalProps {
	visible: boolean;
	mode?: "create" | "edit";
	clique?: Clique | null;
	onClose: () => void;
	onCreated?: (clique: Clique) => void;
	onUpdated?: (clique: Clique) => void;
}

export function CreateCliqueModal({
	visible,
	mode = "create",
	clique,
	onClose,
	onCreated,
	onUpdated,
}: CreateCliqueModalProps) {
	const isEditMode = mode === "edit" || Boolean(clique);
	const modalTitle = isEditMode ? "Edit Clique" : "Create Clique";
	const submitLabel = isEditMode ? "Save Changes" : "Create Clique";

	const createCliqueMutation = useCreateCliqueMutation();
	const updateCliqueMutation = useUpdateCliqueMutation();
	const occupationsQuery = useListOccupationsQuery(100);
	const createOccupationMutation = useCreateOccupationMutation();

	const isSubmitting =
		createCliqueMutation.isPending || updateCliqueMutation.isPending;

	const initialValues = useMemo(() => {
		if (!clique) return undefined;
		return {
			name: clique.name,
			description: clique.description,
			imageUrl: clique.imageUrl,
			privacy: clique.privacy,
			timezone: clique.timezone,
			cancellationCutoffHours: clique.cancellationCutoffHours,
			occupationIds: clique.occupationIds
				? [...clique.occupationIds]
				: undefined,
		};
	}, [clique]);

	const handleSubmit = useCallback(
		async (values: CliqueFormSubmitPayload) => {
			if (isEditMode && clique) {
				try {
					const updated = await updateCliqueMutation.mutateAsync({
						params: { path: { cliqueId: clique.id } },
						body: {
							name: values.name,
							description: values.description ?? undefined,
							imageUrl: values.imageUrl ?? undefined,
							privacy: values.privacy,
							timezone: values.timezone,
							cancellationCutoffHours: values.cancellationCutoffHours,
							occupationIds: values.occupationIds,
						},
					});
					showToast({ type: "success", message: "Clique updated" });
					onUpdated?.(updated);
					onClose();
				} catch (error: unknown) {
					showToast({
						type: "error",
						message: getErrorMessage(error, "Failed to update clique"),
					});
				}
				return;
			}

			try {
				const created = await createCliqueMutation.mutateAsync({
					body: {
						name: values.name,
						description: values.description ?? undefined,
						imageUrl: values.imageUrl ?? undefined,
						privacy: values.privacy,
						timezone: values.timezone,
						cancellationCutoffHours: values.cancellationCutoffHours,
						occupationIds: values.occupationIds,
					},
				});
				showToast({ type: "success", message: "Clique created" });
				onCreated?.(created);
				onClose();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to create clique"),
				});
			}
		},
		[
			clique,
			createCliqueMutation,
			isEditMode,
			onClose,
			onCreated,
			onUpdated,
			updateCliqueMutation,
		],
	);

	const handleCreateOccupation = useCallback(
		async (name: string): Promise<Occupation | null> => {
			try {
				const created = await createOccupationMutation.mutateAsync({
					body: { name },
				});
				if (created) {
					showToast({
						type: "success",
						message: `Created occupation "${created.name}"`,
					});
					return created as Occupation;
				}
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(
						error,
						"Failed to create occupation. Please try again.",
					),
				});
			}
			return null;
		},
		[createOccupationMutation],
	);

	return (
		<AppModal visible={visible} onClose={onClose} title={modalTitle}>
			<CliqueForm
				initialValues={initialValues}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				submitLabel={submitLabel}
				occupations={(occupationsQuery.data ?? []) as Occupation[]}
				occupationsLoading={occupationsQuery.isLoading}
				onCreateOccupation={handleCreateOccupation}
			/>
		</AppModal>
	);
}
