import { withApiOrigin } from "./config";
import { ApiError, UnauthorizedError } from "./errors";

export interface AuthUser {
  email: string;
}

interface LoginResponse {
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

const AUTH_BASE = withApiOrigin("/api/auth");

const parseErrorResponse = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return `Solicitud fallida con estado ${response.status}`;
  }
  try {
    const body = (await response.json()) as { message?: string };
    return body?.message ?? `Solicitud fallida con estado ${response.status}`;
  } catch {
    return `Solicitud fallida con estado ${response.status}`;
  }
};

const mapError = async (response: Response): Promise<never> => {
  const message = await parseErrorResponse(response);
  if (response.status === 401) {
    throw new UnauthorizedError(message);
  }
  throw new ApiError(message, response.status);
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthUser> => {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    await mapError(response);
  }

  const data = (await response.json()) as LoginResponse;
  return data.user;
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await fetch(`${AUTH_BASE}/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await mapError(response);
  }

  const data = (await response.json()) as MeResponse;
  return data.user;
};

export const logout = async (): Promise<void> => {
  const response = await fetch(`${AUTH_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    await mapError(response);
  }
};
