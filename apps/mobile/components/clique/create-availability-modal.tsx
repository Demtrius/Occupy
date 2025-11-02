import { useCallback, useMemo } from "react";
import {
	AvailabilityForm,
	type AvailabilityFormSubmitPayload,
	type AvailabilityFormValues,
} from "@/components/clique/forms/availability-form";
import { AppModal } from "@/components/ui/modal";
import {
	useCreateAvailabilityMutation,
	useUpdateAvailabilityMutation,
} from "@/hooks/use-availability";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Availability } from "@/types";

interface CreateAvailabilityModalProps {
	visible: boolean;
	cliqueId: string;
	defaultTimezone?: string | null;
	mode?: "create" | "edit";
	availability?: Availability | null;
	onClose: () => void;
	onCreated?: (availability: Availability) => void;
	onUpdated?: (availability: Availability) => void;
}

export function CreateAvailabilityModal({
	visible,
	cliqueId,
	defaultTimezone = "UTC",
	mode = "create",
	availability,
	onClose,
	onCreated,
	onUpdated,
}: CreateAvailabilityModalProps) {
	const isEditMode = mode === "edit" || Boolean(availability);
	const modalTitle = isEditMode ? "Edit Availability" : "Create Availability";
	const submitLabel = isEditMode ? "Save Changes" : "Create Availability";

	const createAvailabilityMutation = useCreateAvailabilityMutation();
	const updateAvailabilityMutation = useUpdateAvailabilityMutation();

	const isSubmitting =
		createAvailabilityMutation.isPending ||
		updateAvailabilityMutation.isPending;

	const initialValues = useMemo<
		Partial<AvailabilityFormValues> | undefined
	>(() => {
		if (!availability) return undefined;
		return {
			isRecurring: availability.isRecurring ?? true,
			dayOfWeek: availability.isRecurring
				? (availability.dayOfWeek ?? 1)
				: null,
			date: availability.isRecurring ? "" : (availability.date ?? ""),
			startTime: toDisplayTime(availability.startTime) ?? "09:00",
			endTime: toDisplayTime(availability.endTime) ?? "17:00",
			validFrom: availability.isRecurring ? (availability.validFrom ?? "") : "",
			validUntil: availability.isRecurring
				? (availability.validUntil ?? "")
				: "",
			timezone: availability.timezone ?? defaultTimezone ?? "UTC",
		};
	}, [availability, defaultTimezone]);

	const handleSubmit = useCallback(
		async (values: AvailabilityFormSubmitPayload) => {
			if (isEditMode && availability) {
				try {
					const updated = (await updateAvailabilityMutation.mutateAsync({
						params: {
							path: { availabilityId: availability.id },
						},
						body: values,
					})) as Availability;
					showToast({ type: "success", message: "Availability updated" });
					onUpdated?.(updated);
					onClose();
				} catch (error: unknown) {
					showToast({
						type: "error",
						message: getErrorMessage(error, "Failed to update availability"),
					});
				}
				return;
			}

			if (!cliqueId) {
				showToast({ type: "error", message: "Missing clique context." });
				return;
			}

			try {
				const created = (await createAvailabilityMutation.mutateAsync({
					params: {
						query: { cliqueId },
					},
					body: values,
				})) as Availability;
				showToast({ type: "success", message: "Availability created" });
				onCreated?.(created);
				onClose();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to create availability"),
				});
			}
		},
		[
			availability,
			cliqueId,
			createAvailabilityMutation,
			isEditMode,
			onClose,
			onCreated,
			onUpdated,
			updateAvailabilityMutation,
		],
	);

	return (
		<AppModal visible={visible} onClose={onClose} title={modalTitle}>
			<AvailabilityForm
				initialValues={initialValues}
				defaultTimezone={availability?.timezone ?? defaultTimezone}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				submitLabel={submitLabel}
			/>
		</AppModal>
	);
}

function toDisplayTime(time?: string | null): string | undefined {
	if (!time) return undefined;
	const [hours, minutes] = time.split(":");
	if (!hours || !minutes) return time.slice(0, 5);
	return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}
