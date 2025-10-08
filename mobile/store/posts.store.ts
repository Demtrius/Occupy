import { create } from "zustand";
import { postsService } from "../services/posts.service";
import { showError } from "./app.store";
import { Post } from "../types";

interface PostsState {
  // State
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  page: number;
  search: string;
  category: number | "all";

  // Cache
  postsCache: Record<string, Post[]>;
  categoryPages: Record<string, number>;
  categoryHasMore: Record<string, boolean>;

  // Actions
  setSearch: (search: string) => void;
  setCategory: (category: number | "all") => void;
  fetchPosts: (categoryFilter?: number | "all", pageNum?: number, append?: boolean) => Promise<void>;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  clearCache: () => void;
  reset: () => void;
}

const initialState = {
  posts: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  hasMore: true,
  page: 1,
  search: "",
  category: "all" as const,

  postsCache: {},
  categoryPages: {},
  categoryHasMore: {},
};

export const usePostsStore = create<PostsState>((set, get) => ({
  ...initialState,

  setSearch: (search: string) => {
    set({ search });
  },

  setCategory: (category: number | "all") => {
    set({ category });
  },

  fetchPosts: async (categoryFilter = "all", pageNum = 1, append = false) => {
    try {
      const { postsCache, categoryPages, categoryHasMore } = get();
      const cacheKey = categoryFilter.toString();

      // Check cache first
      const cachedPosts = postsCache[cacheKey] || [];
      const currentPage = categoryPages[cacheKey] || 1;
      const currentHasMore = categoryHasMore[cacheKey] ?? true;

      // If we have cached data and not appending, use cache
      if (!append && cachedPosts.length > 0 && pageNum === 1) {
        set({
          posts: cachedPosts,
          hasMore: currentHasMore,
          page: currentPage,
          loading: false,
        });
        return;
      }

      // Set loading state
      if (append) {
        set({ loadingMore: true });
      } else {
        set({ loading: true });
      }

      let data: Post[] = [];

      if (categoryFilter === "all") {
        const response = await postsService.getFeedPosts(pageNum, 20);
        data = response.results || [];
      } else {
        const response = await postsService.getPostsByClique(categoryFilter, pageNum, 20);
        data = response.results || [];
      }

      if (append) {
        // Remove duplicates when appending
        const existingPosts = postsCache[cacheKey] || [];
        const combined = [...existingPosts, ...data];
        const unique = combined.filter(
          (item, index, self) => self.findIndex((p) => p.id === item.id) === index
        );

        const newCache = { ...postsCache, [cacheKey]: unique };
        set({
          posts: unique,
          postsCache: newCache,
          loadingMore: false,
        });
      } else {
        const newCache = { ...postsCache, [cacheKey]: data };
        set({
          posts: data,
          postsCache: newCache,
          loading: false,
        });
      }

      // Update pagination state for this category
      const newPage = append ? currentPage + 1 : pageNum;
      const newHasMore = data.length === 20 && newPage < 10;

      const newPages = { ...categoryPages, [cacheKey]: newPage };
      const newHasMoreState = { ...categoryHasMore, [cacheKey]: newHasMore };

      set({
        categoryPages: newPages,
        categoryHasMore: newHasMoreState,
        hasMore: newHasMore,
        page: newPage,
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      showError("Failed to load posts");
      set({
        loading: false,
        loadingMore: false,
        refreshing: false,
      });
    }
  },

  refreshPosts: async () => {
    const { category, postsCache, categoryPages, categoryHasMore } = get();
    set({ refreshing: true, page: 1, hasMore: true });

    // Clear cache for current category
    const cacheKey = category.toString();
    const newCache = { ...postsCache };
    delete newCache[cacheKey];
    const newPages = { ...categoryPages };
    delete newPages[cacheKey];
    const newHasMore = { ...categoryHasMore };
    delete newHasMore[cacheKey];

    set({
      postsCache: newCache,
      categoryPages: newPages,
      categoryHasMore: newHasMore,
    });

    try {
      await get().fetchPosts(category, 1, false);
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      set({ refreshing: false });
    }
  },

  loadMorePosts: async () => {
    const { loadingMore, hasMore, page, category } = get();

    if (loadingMore || !hasMore || page >= 10) return;

    set({ loadingMore: true });
    try {
      await get().fetchPosts(category, page + 1, true);
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      set({ loadingMore: false });
    }
  },

  clearCache: () => {
    set({
      postsCache: {},
      categoryPages: {},
      categoryHasMore: {},
    });
  },

  reset: () => {
    set(initialState);
  },
}));

export default usePostsStore;