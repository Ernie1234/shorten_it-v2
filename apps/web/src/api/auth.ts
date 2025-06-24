import type { ApiResponse, IUser } from "@repo/types";

const API_GATEWAY_URL = "http://localhost:5000/api";

interface AuthResponseData {
  user: Partial<IUser>;
  token: string;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

export const registerUser = async (
  params: RegisterParams,
): Promise<ApiResponse<Partial<IUser>>> => {
  const response = await fetch(`${API_GATEWAY_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data: ApiResponse<Partial<IUser>> = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to register.");
  }
  return data;
};

export const loginUser = async (
  params: LoginParams,
): Promise<ApiResponse<AuthResponseData>> => {
  const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data: ApiResponse<AuthResponseData> = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to login.");
  }
  return data;
};

export const googleLogin = () => {
  window.location.href = `${API_GATEWAY_URL}/auth/google`;
};
