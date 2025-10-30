import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Comment } from "@/types";

interface CommentNode {
	comment: Comment;
	replies: CommentNode[];
}

export interface FlattenedThreadComment {
	comment: Comment;
	depth: number;
	replyLabel?: string;
	totalReplies: number;
	isCollapsed: boolean;
	isRoot: boolean;
}

interface UseCommentThreadsResult {
	comments: FlattenedThreadComment[];
	expandThread: (commentId: string) => void;
	toggleReplies: (commentId: string) => void;
}

export function useCommentThreads(
	comments: Comment[],
): UseCommentThreadsResult {
	const sortedComments = useMemo(() => {
		const list = comments ?? [];
		return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}, [comments]);

	const commentById = useMemo(() => {
		const map = new Map<string, Comment>();
		for (const comment of sortedComments) {
			map.set(comment.id, comment);
		}
		return map;
	}, [sortedComments]);

	const parentLookup = useMemo(() => {
		const map = new Map<string, string | null>();
		for (const comment of sortedComments) {
			map.set(comment.id, comment.parentCommentId ?? null);
		}
		return map;
	}, [sortedComments]);

	const commentTree = useMemo<CommentNode[]>(() => {
		const nodes = new Map<string, CommentNode>();
		for (const comment of sortedComments) {
			nodes.set(comment.id, { comment, replies: [] });
		}

		const roots: CommentNode[] = [];
		for (const comment of sortedComments) {
			const node = nodes.get(comment.id);
			if (!node) continue;

			const parentId = comment.parentCommentId;
			const parentNode = parentId ? nodes.get(parentId) : undefined;
			if (parentNode) {
				parentNode.replies.push(node);
			} else {
				roots.push(node);
			}
		}

		return roots;
	}, [sortedComments]);

	const replyLabelLookup = useMemo(() => {
		const map = new Map<string, string>();
		for (const comment of sortedComments) {
			const parentId = comment.parentCommentId;
			if (!parentId) continue;
			const parent = commentById.get(parentId);
			if (!parent) continue;

			const parentFullName = (parent.author?.fullName ?? "").trim();
			const parentUsername = (parent.author?.username ?? "").trim();
			const fallback = parent.author?.id ?? "";
			const label = parentFullName || parentUsername || fallback;
			if (label) {
				map.set(comment.id, label);
			}
		}
		return map;
	}, [commentById, sortedComments]);

	const totalRepliesLookup = useMemo(() => {
		const map = new Map<string, number>();

		const countReplies = (node: CommentNode): number => {
			let total = 0;
			for (const child of node.replies) {
				total += 1 + countReplies(child);
			}
			map.set(node.comment.id, total);
			return total;
		};

		for (const root of commentTree) {
			countReplies(root);
		}

		return map;
	}, [commentTree]);

	const expandedByUserRef = useRef<Set<string>>(new Set());
	const [collapsedThreadIds, setCollapsedThreadIds] = useState<Set<string>>(
		() => new Set(),
	);

	useEffect(() => {
		setCollapsedThreadIds((prev) => {
			const next = new Set(prev);
			let changed = false;

			for (const node of commentTree) {
				const id = node.comment.id;
				if (
					node.replies.length > 0 &&
					!expandedByUserRef.current.has(id) &&
					!next.has(id)
				) {
					next.add(id);
					changed = true;
				}
			}

			return changed ? next : prev;
		});
	}, [commentTree]);

	const expandThread = useCallback(
		(commentId: string) => {
			setCollapsedThreadIds((prev) => {
				if (prev.size === 0) {
					return prev;
				}
				const next = new Set(prev);
				let current: string | null | undefined = commentId;
				while (current) {
					if (next.delete(current)) {
						expandedByUserRef.current.add(current);
					}
					current = parentLookup.get(current) ?? null;
				}
				return next;
			});
		},
		[parentLookup],
	);

	const toggleReplies = useCallback((commentId: string) => {
		setCollapsedThreadIds((prev) => {
			const next = new Set(prev);
			if (next.has(commentId)) {
				next.delete(commentId);
				expandedByUserRef.current.add(commentId);
			} else {
				next.add(commentId);
				expandedByUserRef.current.delete(commentId);
			}
			return next;
		});
	}, []);

	const flattenedComments = useMemo<FlattenedThreadComment[]>(() => {
		const items: FlattenedThreadComment[] = [];

		const visit = (node: CommentNode, depth: number) => {
			const id = node.comment.id;
			const replyLabel = replyLabelLookup.get(id);
			const totalReplies = totalRepliesLookup.get(id) ?? 0;
			const isCollapsed = collapsedThreadIds.has(id);
			const isRoot = !node.comment.parentCommentId;

			items.push({
				comment: node.comment,
				depth,
				replyLabel,
				totalReplies,
				isCollapsed,
				isRoot,
			});

			if (isCollapsed) {
				return;
			}

			for (const child of node.replies) {
				visit(child, depth + 1);
			}
		};

		for (const root of commentTree) {
			visit(root, 0);
		}

		return items;
	}, [collapsedThreadIds, commentTree, replyLabelLookup, totalRepliesLookup]);

	return {
		comments: flattenedComments,
		expandThread,
		toggleReplies,
	};
}
