import { useCreateBookingMutation } from "@/hooks/use-bookings";
import type { Service } from "@/types";
import { BookingForm } from "./forms/booking-form";

interface CreateBookingModalProps {
	visible: boolean;
	onClose: () => void;
	service: Service;
	cliqueId: string;
}

export function CreateBookingModal({
	onClose,
	service,
	cliqueId,
}: CreateBookingModalProps) {
	const createBookingMutation = useCreateBookingMutation();

	const handleBookingSubmit = (startDateTime: Date) => {
		createBookingMutation.mutate(
			{
				body: {
					serviceId: service.id,
					startTs: startDateTime.toISOString(),
				},
			},
			{
				onSuccess: () => {
					onClose();
				},
			},
		);
	};

	return (
		<BookingForm
			service={service}
			cliqueId={cliqueId}
			onSubmit={handleBookingSubmit}
			isLoading={createBookingMutation.isPending}
		/>
	);
}
