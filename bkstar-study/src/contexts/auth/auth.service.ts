import { authApi } from "@/api/auth.api";
import type { User } from "@/types/auth.types";
import {
    setAccessToken,
    setRefreshToken,
    clearTokens,
    getRefreshToken,
    setRememberEmail,
    clearRememberEmail,
} from "@/utils/storage.utils";
import { getUserInfoFromToken } from "@/utils/jwt.utils";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api.constants";

export async function login(
    email: string,
    password: string,
    rememberMe: boolean
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await authApi.login({ email, password });

    setAccessToken(response.access, rememberMe);
    setRefreshToken(response.refresh, rememberMe);
    if (rememberMe) setRememberEmail(email);

    const user = getUserInfoFromToken(response.access);
    if (!user) throw new Error("Invalid token response");

    return {
        user,
        accessToken: response.access,
        refreshToken: response.refresh,
    };
}

export async function register(
    name: string,
    email: string,
    password: string,
    role: "student" | "teacher"
): Promise<void> {
    await authApi.register({
        name,
        email,
        password,
        role,
        status: "confirming",
    });
}

export async function refreshToken(): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
} | null> {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`;
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    setAccessToken(data.access);
    if (data.refresh) setRefreshToken(data.refresh);

    const user = getUserInfoFromToken(data.access);
    if (!user) return null;

    return {
        user,
        accessToken: data.access,
        refreshToken: data.refresh || data.access,
    };
}

export function logout(): void {
    clearTokens();
    clearRememberEmail();
}
