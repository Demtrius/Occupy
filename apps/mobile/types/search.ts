import type { Clique } from "./cliques";
import type { Occupation } from "./occupations";
import type { User } from "./users";

export type UserSearchParams = {
	q?: string;
	occupationId?: string;
	sort?: string;
	cursor?: string;
	limit?: number;
};

export type SearchResult = {
	users: User[];
	occupations: Occupation[];
	cliques: Clique[];
};
