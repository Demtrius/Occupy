import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cliques from "@/api/cliques";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cliques.createClique,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cliques"] });
		},
	});
}

export function useGetCliqueQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", cliqueId],
		queryFn: () => cliques.getClique(cliqueId!),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			body,
		}: {
			cliqueId: string;
			body: Parameters<typeof cliques.updateClique>[1];
		}) => cliques.updateClique(cliqueId, body),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}

export function useDeleteCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cliques.deleteClique,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cliques"] });
		},
	});
}

export function useJoinCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			inviteToken,
		}: {
			cliqueId: string;
			inviteToken?: string;
		}) => cliques.joinClique(cliqueId, inviteToken),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
			queryClient.invalidateQueries({ queryKey: ["cliques", "user"] });
		},
	});
}

export function useLeaveCliqueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cliques.leaveClique,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cliques"] });
		},
	});
}

export function useListCliqueMembersQuery(
	cliqueId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", cliqueId, "members", { cursor, limit }],
		queryFn: () => cliques.listCliqueMembers(cliqueId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useListPendingMembersQuery(
	cliqueId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", cliqueId, "pending", { cursor, limit }],
		queryFn: () => cliques.listPendingMembers(cliqueId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useApproveMembershipMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			memberId,
		}: {
			cliqueId: string;
			memberId: string;
		}) => cliques.approveMembership(cliqueId, memberId),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({
				queryKey: ["cliques", cliqueId, "members"],
			});
			queryClient.invalidateQueries({
				queryKey: ["cliques", cliqueId, "pending"],
			});
		},
	});
}

export function useRejectMembershipMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			memberId,
		}: {
			cliqueId: string;
			memberId: string;
		}) => cliques.rejectMembership(cliqueId, memberId),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({
				queryKey: ["cliques", cliqueId, "pending"],
			});
		},
	});
}

export function useListUserCliquesQuery(
	userId: string | undefined,
	enabled = true,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", "user", userId, { cursor, limit }],
		queryFn: () => cliques.listUserCliques(userId!, cursor, limit),
		enabled: !!tokens?.accessToken && !!userId && enabled,
	});
}

export function useCreateInviteMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			cliqueId,
			body,
		}: {
			cliqueId: string;
			body: Parameters<typeof cliques.createInvite>[1];
		}) => cliques.createInvite(cliqueId, body),
		onSuccess: (_, { cliqueId }) => {
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}

export function useGetCliqueFeedQuery(cursor?: string, limit = 20) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", "feed", { cursor, limit }],
		queryFn: () => cliques.getCliqueFeed(cursor, limit),
		enabled: !!tokens?.accessToken,
	});
}

export function useListCliquesQuery(limit = 20) {
	const { tokens } = useAuthStore();
	return useQuery({
		queryKey: ["cliques", "all", { limit }],
		queryFn: () => cliques.listCliques(undefined, limit),
		enabled: !!tokens?.accessToken,
	});
}
