import { create } from "zustand";

type Toast = {
	id: string;
	type?: "success" | "error" | "info";
	title?: string;
	message?: string;
	duration?: number;
};
type ToastState = {
	toasts: Toast[];
	show: (t: Omit<Toast, "id">) => void;
	dismiss: (id: string) => void;
	clear: () => void;
};
export const useToastStore = create<ToastState>((set, get) => ({
	toasts: [],
	show: (t) => {
		const id = Math.random().toString(36).slice(2);
		const toast: Toast = { id, duration: 2500, type: "info", ...t };
		set({ toasts: [...get().toasts, toast] });
		setTimeout(() => get().dismiss(id), toast.duration);
	},
	dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
	clear: () => set({ toasts: [] }),
}));
export const showToast = (t: Omit<Toast, "id">) =>
	useToastStore.getState().show(t);
