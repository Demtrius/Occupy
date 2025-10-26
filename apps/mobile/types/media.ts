export type MediaCreate = {
	url: string;
	mime?: string | null;
	sizeBytes?: number | null;
	meta?: Record<string, any> | null;
};
