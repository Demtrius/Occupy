export function getFormattedDate(date: Date): string {
	const dd = String(date.getDate()).padStart(2, "0");
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const yyyy = String(date.getFullYear());

	return `${yyyy}-${mm}-${dd}`;
}

export const formatDateForAPI = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const formatTimeForAPI = (date: Date): string => {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}:00`;
};

export const formatTimeDisplay = (date: Date): string => {
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

export const parseTimeToMinutes = (time: string): number => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

export const addMinutesToTime = (
	time: string,
	minutesToAdd: number,
): string => {
	const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

export const calculateDuration = (startTime: Date, endTime: Date) => {
	const durationMs = endTime.getTime() - startTime.getTime();
	const hours = Math.floor(durationMs / (1000 * 60 * 60));
	const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
	return { hours, minutes };
};
