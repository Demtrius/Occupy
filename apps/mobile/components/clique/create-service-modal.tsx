import { useCallback, useMemo } from "react";
import type {
	ServiceFormSubmitPayload,
	ServiceFormValues,
} from "@/components/clique/forms/service-form";
import { ServiceForm } from "@/components/clique/forms/service-form";
import { AppModal } from "@/components/ui/modal";
import {
	useCreateServiceMutation,
	useUpdateServiceMutation,
} from "@/hooks/use-services";
import { getErrorMessage } from "@/lib/error-utils";
import { showToast } from "@/stores/toast-store";
import type { Service } from "@/types";

interface CreateServiceModalProps {
	visible: boolean;
	cliqueId: string;
	defaultCurrency?: string | null;
	mode?: "create" | "edit";
	service?: Service | null;
	onClose: () => void;
	onCreated?: (service: Service) => void;
	onUpdated?: (service: Service) => void;
}

export function CreateServiceModal({
	visible,
	cliqueId,
	defaultCurrency = "USD",
	mode = "create",
	service,
	onClose,
	onCreated,
	onUpdated,
}: CreateServiceModalProps) {
	const isEditMode = mode === "edit" || Boolean(service);
	const modalTitle = isEditMode ? "Edit Service" : "Create Service";
	const submitLabel = isEditMode ? "Save Changes" : "Create Service";

	const createServiceMutation = useCreateServiceMutation();
	const updateServiceMutation = useUpdateServiceMutation();

	const isSubmitting =
		createServiceMutation.isPending || updateServiceMutation.isPending;

	const initialValues = useMemo<Partial<ServiceFormValues> | undefined>(() => {
		if (!service) return undefined;
		return {
			title: service.title ?? "",
			description: service.description ?? "",
			price:
				service.priceMinor != null ? (service.priceMinor / 100).toFixed(2) : "",
			currency: service.currency ?? defaultCurrency ?? "USD",
			durationMinutes: (service.durationMinutes ?? 60).toString(),
			bufferMinutes: (service.bufferMinutes ?? 0).toString(),
			isActive: service.isActive ?? true,
		};
	}, [defaultCurrency, service]);

	const handleSubmit = useCallback(
		async (values: ServiceFormSubmitPayload) => {
			if (isEditMode && service) {
				try {
					const updated = await updateServiceMutation.mutateAsync({
						params: { path: { serviceId: service.id } },
						body: {
							title: values.title,
							description: values.description,
							priceMinor: values.priceMinor,
							durationMinutes: values.durationMinutes,
							bufferMinutes: values.bufferMinutes,
							isActive: values.isActive,
						},
					});
					showToast({ type: "success", message: "Service updated" });
					onUpdated?.(updated);
					onClose();
				} catch (error: unknown) {
					showToast({
						type: "error",
						message: getErrorMessage(error, "Failed to update service"),
					});
				}
				return;
			}

			if (!cliqueId) {
				showToast({ type: "error", message: "Missing clique context." });
				return;
			}

			try {
				const created = await createServiceMutation.mutateAsync({
					params: {
						query: { cliqueId },
					},
					body: {
						title: values.title,
						description: values.description,
						priceMinor: values.priceMinor,
						currency: values.currency,
						durationMinutes: values.durationMinutes,
						bufferMinutes: values.bufferMinutes,
						isActive: values.isActive,
					},
				});
				showToast({ type: "success", message: "Service created" });
				onCreated?.(created);
				onClose();
			} catch (error: unknown) {
				showToast({
					type: "error",
					message: getErrorMessage(error, "Failed to create service"),
				});
			}
		},
		[
			cliqueId,
			createServiceMutation,
			isEditMode,
			onClose,
			onCreated,
			onUpdated,
			service,
			updateServiceMutation,
		],
	);

	return (
		<AppModal visible={visible} onClose={onClose} title={modalTitle}>
			<ServiceForm
				initialValues={initialValues}
				defaultCurrency={service?.currency ?? defaultCurrency}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
				submitLabel={submitLabel}
				allowCurrencyEdit={!isEditMode}
			/>
		</AppModal>
	);
}
