import type { Clique } from "./cliques";
import type { Occupation } from "./occupations";
import type { User, UserSearchParams } from "./users";

export type SearchResult = {
	users: User[];
	occupations: Occupation[];
	cliques: Clique[];
};
