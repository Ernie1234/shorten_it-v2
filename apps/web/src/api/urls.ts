import type { ApiResponse, IUrl } from "@repo/types";

const API_GATEWAY_URL = "http://localhost:5000/api";

interface ShortenUrlPayload {
  originalUrl: string;
}

export const shortenUrl = async (
  payload: ShortenUrlPayload,
  token: string | null,
): Promise<ApiResponse<IUrl>> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_GATEWAY_URL}/urls/shorten`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });
  const data: ApiResponse<IUrl> = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to shorten URL.");
  }
  return data;
};

export const fetchMyUrls = async (
  token: string,
): Promise<ApiResponse<IUrl[]>> => {
  const response = await fetch(`${API_GATEWAY_URL}/urls/my-urls`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data: ApiResponse<IUrl[]> = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch URLs.");
  }
  return data;
};
