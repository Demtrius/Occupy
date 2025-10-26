export type Availability = {
	isRecurring: boolean;
	date?: string | null;
	dayOfWeek?: number | null;
	startTime: string;
	endTime: string;
	validFrom?: string | null;
	validUntil?: string | null;
	timezone: string;
	id: string;
	cliqueId: string;
	createdAt: string;
	updatedAt: string;
};

export type AvailabilityCreate = {
	isRecurring: boolean;
	date?: string | null;
	dayOfWeek?: number | null;
	startTime: string;
	endTime: string;
	validFrom?: string | null;
	validUntil?: string | null;
	timezone: string;
};

export type AvailabilityUpdate = {
	isRecurring?: boolean | null;
	date?: string | null;
	dayOfWeek?: number | null;
	startTime?: string | null;
	endTime?: string | null;
	validFrom?: string | null;
	validUntil?: string | null;
	timezone?: string | null;
};
