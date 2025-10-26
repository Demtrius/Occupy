import type { CursorPage } from "./base";

export type Booking = {
	id: string;
	serviceId: string;
	cliqueId: string;
	userId: string;
	startTs: string;
	endTs: string;
	status: BookingStatus;
	cancelledBy?: CancelledBy | null;
	cancellationReason?: string | null;
	note?: string | null;
	idempotencyKey?: string | null;
	createdAt: string;
	updatedAt: string;
	service?: {
		title: string;
		description?: string;
		durationMinutes: number;
		priceMinor?: number;
		currency: string;
	};
	clique?: {
		name: string;
		imageUrl?: string;
	};
};

export type BookingCreate = {
	serviceId: string;
	startTs: string;
	note?: string | null;
	idempotencyKey?: string | null;
};

export type BookingReschedule = {
	startTs: string;
};

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type CancelledBy = "owner" | "client";

export type CursorPageBookings = CursorPage<Booking>;
