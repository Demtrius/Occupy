export type Service = {
	title: string;
	description?: string | null;
	priceMinor?: number | null;
	currency: string;
	durationMinutes: number;
	bufferMinutes: number;
	isActive: boolean;
	id: string;
	cliqueId: string;
	createdAt: string;
	updatedAt: string;
};

export type ServiceCreate = {
	title: string;
	description?: string | null;
	priceMinor?: number | null;
	currency: string;
	durationMinutes: number;
	bufferMinutes: number;
	isActive: boolean;
};

export type ServiceUpdate = {
	title?: string | null;
	description?: string | null;
	priceMinor?: number | null;
	durationMinutes?: number | null;
	bufferMinutes?: number | null;
	isActive?: boolean | null;
};
