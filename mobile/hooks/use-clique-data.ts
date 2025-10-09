import { useState, useEffect, useCallback } from "react";
import { cliquesService } from "../services";
import { showError, showSuccess } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import type { Clique } from "../types";

export const useCliqueData = (id: number) => {
	const user = useAuthStore((state) => state.user);

	const [clique, setClique] = useState<Clique | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [isMember, setIsMember] = useState<boolean>(false);
	const [isOwner, setIsOwner] = useState<boolean>(false);
	const [joiningClique, setJoiningClique] = useState<boolean>(false);

	const loadCliqueData = useCallback(async () => {
		try {
			setLoading(true);
			const cliqueData = await cliquesService.getCliqueById(id);
			setClique(cliqueData);

			// Handle createdBy being either a User object or just an ID
			const createdById =
				typeof cliqueData.createdBy === "object"
					? cliqueData.createdBy?.id
					: cliqueData.createdBy;
			setIsOwner(createdById === user?.id);
			setIsMember(cliqueData.isMember ?? false);
		} catch (error: any) {
			console.error("Error loading clique:", error);
			showError(error.message || "Failed to load clique");
		} finally {
			setLoading(false);
		}
	}, [id, user?.id]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadCliqueData();
		} catch (error) {
			console.error("Error refreshing:", error);
		} finally {
			setRefreshing(false);
		}
	}, [loadCliqueData]);

	const handleJoinLeave = useCallback(async () => {
		if (!user) {
			showError("Please log in to join this clique");
			return;
		}

		try {
			setJoiningClique(true);
			if (isMember) {
				await cliquesService.leaveClique(id);
				setIsMember(false);
				showSuccess("Left the clique");
			} else {
				await cliquesService.joinClique(id);
				setIsMember(true);
				showSuccess("Joined the clique");
			}
			await loadCliqueData();
		} catch (error: any) {
			console.error("Error joining/leaving clique:", error);
			showError(error.message || "Failed to update membership");
		} finally {
			setJoiningClique(false);
		}
	}, [id, user, isMember, loadCliqueData]);

	useEffect(() => {
		loadCliqueData();
	}, [loadCliqueData]);

	return {
		clique,
		loading,
		refreshing,
		isMember,
		isOwner,
		joiningClique,
		loadCliqueData,
		onRefresh,
		handleJoinLeave,
	};
};
