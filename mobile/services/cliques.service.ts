import { apiHelpers } from "./api";
import {
  Clique,
  CreateCliqueData,
  PaginatedResponse,
  User,
  ApiError,
} from "../types";

class CliquesService {
  /**
   * Get all cliques
   */
  async getAllCliques(page: number = 1, limit: number = 20): Promise<Clique[]> {
    try {
      const response = await apiHelpers.get<PaginatedResponse<Clique>>("/api/v1/cliques/");
      return response.results || [];
    } catch (error) {
      console.error("Get all cliques error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get clique by ID
   */
  async getCliqueById(cliqueId: number): Promise<Clique> {
    try {
      const clique = await apiHelpers.get<Clique>(`/api/v1/cliques/${cliqueId}/`);
      return clique;
    } catch (error) {
      console.error("Get clique by ID error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new clique
   */
  async createClique(data: CreateCliqueData): Promise<Clique> {
    try {
      const clique = await apiHelpers.post<Clique>("/api/v1/cliques/", data);
      return clique;
    } catch (error) {
      console.error("Create clique error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Update a clique
   */
  async updateClique(
    cliqueId: number,
    data: Partial<CreateCliqueData>,
  ): Promise<Clique> {
    try {
      const clique = await apiHelpers.patch<Clique>(
        `/api/v1/cliques/${cliqueId}/`,
        data,
      );
      return clique;
    } catch (error) {
      console.error("Update clique error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a clique
   */
  async deleteClique(cliqueId: number): Promise<void> {
    try {
      await apiHelpers.delete(`/api/v1/cliques/${cliqueId}/`);
    } catch (error) {
      console.error("Delete clique error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get posts in a clique
   */
  async getCliquePosts(cliqueId: number): Promise<any[]> {
    try {
      const response = await apiHelpers.get<any[]>(
        `/api/v1/cliques/${cliqueId}/posts/`,
      );
      return response;
    } catch (error) {
      console.error("Get clique posts error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Join a clique
   */
  async joinClique(cliqueId: number): Promise<void> {
    try {
      await apiHelpers.post(`/api/v1/cliques/${cliqueId}/join/`, {});
    } catch (error) {
      console.error("Join clique error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Leave a clique
   */
  async leaveClique(cliqueId: number): Promise<void> {
    try {
      await apiHelpers.post(`/api/v1/cliques/${cliqueId}/leave/`, {});
    } catch (error) {
      console.error("Leave clique error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get clique members
   */
  async getCliqueMembers(
    cliqueId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<User[]> {
    try {
      const members = await apiHelpers.get<User[]>(
        `/api/v1/cliques/${cliqueId}/members/?page=${page}&limit=${limit}`,
      );
      return members;
    } catch (error) {
      console.error("Get clique members error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user's joined cliques
   */
  async getMyCliques(): Promise<Clique[]> {
    try {
      const cliques = await apiHelpers.get<Clique[]>(
        "/api/v1/cliques/my_cliques/",
      );
      return cliques;
    } catch (error) {
      console.error("Get my cliques error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Search cliques
   */
  async searchCliques(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Clique[]> {
    try {
      const cliques = await apiHelpers.get<Clique[]>(
        `/api/v1/cliques/?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      );
      return cliques;
    } catch (error) {
      console.error("Search cliques error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get popular cliques
   */
  async getPopularCliques(limit: number = 10): Promise<Clique[]> {
    try {
      const cliques = await apiHelpers.get<Clique[]>(
        `/api/v1/cliques/?ordering=-members_count&limit=${limit}`,
      );
      return cliques;
    } catch (error) {
      console.error("Get popular cliques error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get recommended cliques
   */
  async getRecommendedCliques(limit: number = 10): Promise<Clique[]> {
    try {
      const cliques = await apiHelpers.get<Clique[]>(
        `/api/v1/cliques/?limit=${limit}`,
      );
      return cliques;
    } catch (error) {
      console.error("Get recommended cliques error:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is member of clique
   */
  async isMember(cliqueId: number): Promise<boolean> {
    try {
      const clique = await this.getCliqueById(cliqueId);
      return clique.isMember || false;
    } catch (error) {
      console.error("Check membership error:", error);
      return false;
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): ApiError {
    if (error.message && error.status) {
      return error as ApiError;
    }

    if (error.response?.data) {
      const data = error.response.data;

      if (data.detail) {
        return {
          message: data.detail,
          status: error.response.status,
        };
      }

      if (typeof data === "object") {
        const messages = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(", ")}`;
            }
            return `${key}: ${value}`;
          })
          .join("\n");

        return {
          message: messages || "Clique operation failed",
          status: error.response.status,
          details: data,
        };
      }
    }

    return {
      message: error.message || "An error occurred with cliques",
      status: error.status || 500,
    };
  }
}

// Export singleton instance
export const cliquesService = new CliquesService();
export default cliquesService;
