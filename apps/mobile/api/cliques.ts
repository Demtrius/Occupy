import { api } from "@/lib/api-client";
import type { CursorPage } from "@/types/base";
import type {
	Clique,
	CliqueCreate,
	CliqueInvite,
	CliqueInviteCreate,
	CliqueMember,
	CliqueUpdate,
} from "@/types/cliques";

export async function createClique(body: CliqueCreate): Promise<Clique> {
	const response = await api.post("/api/v1/cliques", body);
	return response.data as Clique;
}

export async function getClique(
	cliqueId: string,
): Promise<Record<string, any>> {
	const response = await api.get(`/api/v1/cliques/${cliqueId}`);
	return response.data as Record<string, any>;
}

export async function updateClique(
	cliqueId: string,
	body: CliqueUpdate,
): Promise<Clique> {
	const response = await api.patch(`/api/v1/cliques/${cliqueId}`, body);
	return response.data as Clique;
}

export async function deleteClique(cliqueId: string): Promise<void> {
	await api.delete(`/api/v1/cliques/${cliqueId}`);
}

export async function joinClique(
	cliqueId: string,
	inviteToken?: string,
): Promise<CliqueMember> {
	const response = await api.post(
		`/api/v1/cliques/${cliqueId}/join`,
		inviteToken ? { inviteToken } : {},
	);
	return response.data as CliqueMember;
}

export async function leaveClique(
	cliqueId: string,
): Promise<{ status: string }> {
	const response = await api.delete(`/api/v1/cliques/${cliqueId}/members/me`);
	return response.data as { status: string };
}

export async function listCliqueMembers(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<CliqueMember>> {
	const response = await api.get(`/api/v1/cliques/${cliqueId}/members`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<CliqueMember>;
}

export async function listPendingMembers(
	cliqueId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<CliqueMember>> {
	const response = await api.get(
		`/api/v1/cliques/${cliqueId}/members/pending`,
		{
			params: { limit, cursor },
		},
	);
	return response.data as CursorPage<CliqueMember>;
}

export async function approveMembership(
	cliqueId: string,
	memberId: string,
): Promise<CliqueMember> {
	const response = await api.post(
		`/api/v1/cliques/${cliqueId}/members/${memberId}/approve`,
	);
	return response.data as CliqueMember;
}

export async function rejectMembership(
	cliqueId: string,
	memberId: string,
): Promise<{ status: string }> {
	const response = await api.post(
		`/api/v1/cliques/${cliqueId}/members/${memberId}/reject`,
	);
	return response.data as { status: string };
}

export async function listUserCliques(
	userId: string,
	cursor?: string,
	limit = 20,
): Promise<CursorPage<Clique>> {
	const response = await api.get(`/api/v1/cliques/user/${userId}/cliques`, {
		params: { limit, cursor },
	});
	return response.data as CursorPage<Clique>;
}

export async function createInvite(
	cliqueId: string,
	body: CliqueInviteCreate,
): Promise<CliqueInvite> {
	const response = await api.post(`/api/v1/cliques/${cliqueId}/invites`, body);
	return response.data as CliqueInvite;
}

export async function getCliqueFeed(
	cursor?: string,
	limit = 20,
): Promise<CursorPage<any>> {
	const response = await api.get("/api/v1/cliques/feed", {
		params: { limit, cursor },
	});
	return response.data as CursorPage<any>;
}
