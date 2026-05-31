/**
 * API client configuration with Axios.
 * Centralized HTTP request handling, interceptors, and error management.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api";
 *   const response = await apiClient.get<LocationType>("/locations");
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { config } from "@/config";
import { logger } from "@/lib/logger";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // ── Request Interceptor ──
    this.client.interceptors.request.use(
      (requestConfig: CustomAxiosRequestConfig) => {
        const token = this.getAuthToken();
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        logger.debug("API Request", {
          method: requestConfig.method?.toUpperCase(),
          url: requestConfig.url,
        });

        return requestConfig;
      },
      (error: AxiosError) => {
        logger.error("Request setup failed", error);
        return Promise.reject(error);
      }
    );

    // ── Response Interceptor ──
    this.client.interceptors.response.use(
      (response) => {
        logger.debug("API Response", {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string } | undefined;

    let userMessage = "An error occurred. Please try again.";

    if (!navigator.onLine) {
      userMessage = "You are currently offline.";
    } else if (status === 401 || status === 403) {
      userMessage = "You do not have permission to perform this action.";
      // Trigger logout logic here if needed
    } else if (status === 404) {
      userMessage = "The requested resource was not found.";
    } else if (status === 500) {
      userMessage = "Server error. Please try again later.";
    } else if (error.code === "ECONNABORTED") {
      userMessage = "Request timeout. Please check your connection.";
    }

    logger.error("API Error", {
      status,
      message: data?.message || error.message,
      url: error.config?.url,
      userMessage,
    });

    const customError = new Error(userMessage);
    return Promise.reject(customError);
  }

  private getAuthToken(): string | null {
    // Stub: Token retrieval logic (from localStorage, context, etc.)
    // In a real implementation, this would read from context or localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }

  /**
   * Generic GET request with type safety
   */
  async get<T>(url: string, config?: AxiosInstance["defaults"]): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Generic POST request with type safety
   */
  async post<T>(url: string, data?: unknown, config?: AxiosInstance["defaults"]): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request with type safety
   */
  async put<T>(url: string, data?: unknown, config?: AxiosInstance["defaults"]): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request with type safety
   */
  async delete<T>(url: string, config?: AxiosInstance["defaults"]): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Generic PATCH request with type safety
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosInstance["defaults"]): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
