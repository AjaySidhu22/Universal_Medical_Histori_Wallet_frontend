// frontend/src/api/umhwApi.js
import axios from "axios";

const umhwApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ CSRF Token Management
let csrfToken = null;

// Function to fetch CSRF token
const fetchCsrfToken = async () => {
  try {
    const baseURL =
      process.env.REACT_APP_API_URL || "https://localhost:5000/api";
    // Ensure /api is in the URL
    const apiURL = baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`;

    const response = await axios.get(`${apiURL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
    console.log(
      "✅ CSRF token fetched successfully:",
      csrfToken?.substring(0, 20) + "...",
    );
    return csrfToken;
  } catch (error) {
    console.error("❌ Failed to fetch CSRF token:", error);
    throw error;
  }
};

// Fetch CSRF token on app initialization
fetchCsrfToken();

// Request interceptor to attach access token and CSRF token
umhwApi.interceptors.request.use(
  async (config) => {
    // Attach JWT access token
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Attach CSRF token for state-changing requests
    if (
      ["post", "put", "delete", "patch"].includes(config.method.toLowerCase())
    ) {
      // If we don't have a CSRF token, fetch it
      if (!csrfToken) {
        console.log("⚠️ No CSRF token, fetching...");
        await fetchCsrfToken();
      }
      config.headers["x-csrf-token"] = csrfToken;
      console.log(
        `🔒 Sending ${config.method.toUpperCase()} with CSRF token:`,
        csrfToken?.substring(0, 20) + "...",
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh and CSRF errors
umhwApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Handle CSRF token errors (403 Forbidden with "invalid csrf token" message)
    if (
      error.response?.status === 403 &&
      (error.response?.data?.message?.includes("csrf") ||
        error.response?.data?.error?.includes("csrf"))
    ) {
      console.warn("⚠️ CSRF token invalid, refetching...");
      try {
        // Refetch CSRF token
        await fetchCsrfToken();
        // Retry the original request with new CSRF token
        originalRequest.headers["x-csrf-token"] = csrfToken;
        console.log("🔄 Retrying request with new CSRF token");
        return umhwApi(originalRequest);
      } catch (csrfError) {
        console.error("❌ Failed to refresh CSRF token");
        return Promise.reject(csrfError);
      }
    }

    // Handle JWT token refresh (401 Unauthorized)
    // Skip refresh attempt for auth endpoints - these 401s are intentional
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/request-password-reset") ||
      originalRequest.url?.includes("/auth/reset-password");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the JWT token
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || "https://localhost:5000/api"}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newAccessToken = response.data.accessToken;
        sessionStorage.setItem("accessToken", newAccessToken);

        // Retry the original request with new JWT token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return umhwApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear session and redirect to login
        sessionStorage.removeItem("accessToken");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default umhwApi;
