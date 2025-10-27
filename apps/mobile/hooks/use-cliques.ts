import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useCreateCliqueMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/cliques", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cliques"] });
		},
	});
}

export function useGetCliqueQuery(cliqueId: string | undefined) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques/{cliqueId}", {
		params: {
			path: { cliqueId: cliqueId! },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useUpdateCliqueMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("patch", "/api/v1/cliques/{cliqueId}", {
		onSuccess: (data, variables) => {
			const cliqueId = variables.params.path.cliqueId;
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}

export function useDeleteCliqueMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/cliques/{cliqueId}", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cliques"] });
		},
	});
}

export function useJoinCliqueMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/cliques/{cliqueId}/join", {
		onSuccess: (data, variables) => {
			const cliqueId = variables.params.path.cliqueId;
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
			queryClient.invalidateQueries({ queryKey: ["cliques", "user"] });
		},
	});
}

export function useLeaveCliqueMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("delete", "/api/v1/cliques/{cliqueId}/members/me", {
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
	return $api.useQuery("get", "/api/v1/cliques/{cliqueId}/members", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useListPendingMembersQuery(
	cliqueId: string | undefined,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques/{cliqueId}/members/pending", {
		params: {
			path: { cliqueId: cliqueId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!cliqueId,
	});
}

export function useApproveMembershipMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation(
		"post",
		"/api/v1/cliques/{cliqueId}/members/{memberId}/approve",
		{
			onSuccess: (data, variables) => {
				const cliqueId = variables.params.path.cliqueId;
				queryClient.invalidateQueries({
					queryKey: ["cliques", cliqueId, "members"],
				});
				queryClient.invalidateQueries({
					queryKey: ["cliques", cliqueId, "pending"],
				});
			},
		},
	);
}

export function useRejectMembershipMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation(
		"post",
		"/api/v1/cliques/{cliqueId}/members/{memberId}/reject",
		{
			onSuccess: (data, variables) => {
				const cliqueId = variables.params.path.cliqueId;
				queryClient.invalidateQueries({
					queryKey: ["cliques", cliqueId, "pending"],
				});
			},
		},
	);
}

export function useListUserCliquesQuery(
	userId: string | undefined,
	enabled = true,
	cursor?: string,
	limit = 20,
) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques/user/{userId}/cliques", {
		params: {
			path: { userId: userId! },
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken && !!userId && enabled,
	});
}

export function useCreateInviteMutation() {
	const queryClient = useQueryClient();
	return $api.useMutation("post", "/api/v1/cliques/{cliqueId}/invites", {
		onSuccess: (data, variables) => {
			const cliqueId = variables.params.path.cliqueId;
			queryClient.invalidateQueries({ queryKey: ["cliques", cliqueId] });
		},
	});
}

export function useGetCliqueFeedQuery(cursor?: string, limit = 20) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques/feed", {
		params: {
			query: { cursor, limit },
		},
		enabled: !!tokens?.accessToken,
	});
}

export function useListCliquesQuery(limit = 20) {
	const { tokens } = useAuthStore();
	return $api.useQuery("get", "/api/v1/cliques", {
		params: {
			query: { limit },
		},
		enabled: !!tokens?.accessToken,
	});
}
