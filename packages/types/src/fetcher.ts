export const customFetch = async <T>(
	url: string,
	init?: RequestInit,
): Promise<T> => {
	const res = await fetch(url, {
		headers: { "Content-Type": "application/json" },
		...init,
	});
	if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
	return res.json() as Promise<T>;
};
