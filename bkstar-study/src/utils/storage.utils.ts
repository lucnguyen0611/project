import Cookies from "js-cookie";
import { COOKIE_CONFIG } from "@/config/api.config";

// Cookie utilities using js-cookie
export const setCookie = (name: string, value: string, options: any = {}) => {
    const cookieOptions = {
        path: "/",
        secure: true,
        sameSite: "strict" as const,
        ...options,
    };

    Cookies.set(name, value, cookieOptions);
};

export const getCookie = (name: string): string | undefined => {
    return Cookies.get(name);
};

export const deleteCookie = (name: string, options: any = {}) => {
    const cookieOptions = {
        path: "/",
        ...options,
    };

    Cookies.remove(name, cookieOptions);
};

// Token management
export const setAccessToken = (token: string, rememberMe: boolean = false) => {
    const expires = rememberMe ? 7 : 60; // 7 days for remember me, 60 days for normal
    console.log("Setting access token:", {
        name: COOKIE_CONFIG.accessToken.name,
        expires,
        tokenLength: token.length,
    });

    setCookie(COOKIE_CONFIG.accessToken.name, token, {
        expires,
        path: "/",
    });

    // Verify cookie was set
    const savedToken = getCookie(COOKIE_CONFIG.accessToken.name);
    console.log("Access token saved:", {
        saved: !!savedToken,
        savedLength: savedToken?.length || 0,
    });
};

export const setRefreshToken = (token: string, rememberMe: boolean = false) => {
    const expires = rememberMe ? 30 : 7; // 30 days or 7 days
    console.log("Setting refresh token:", {
        name: COOKIE_CONFIG.refreshToken.name,
        expires,
        tokenLength: token.length,
    });

    setCookie(COOKIE_CONFIG.refreshToken.name, token, {
        expires,
        path: "/",
    });

    // Verify cookie was set
    const savedToken = getCookie(COOKIE_CONFIG.refreshToken.name);
    console.log("Refresh token saved:", {
        saved: !!savedToken,
        savedLength: savedToken?.length || 0,
    });
};

export const getAccessToken = (): string | undefined => {
    const token = getCookie(COOKIE_CONFIG.accessToken.name);
    console.log("Getting access token:", {
        name: COOKIE_CONFIG.accessToken.name,
        found: !!token,
        length: token?.length || 0,
    });
    return token;
};

export const getRefreshToken = (): string | undefined => {
    const token = getCookie(COOKIE_CONFIG.refreshToken.name);
    console.log("Getting refresh token:", {
        name: COOKIE_CONFIG.refreshToken.name,
        found: !!token,
        length: token?.length || 0,
    });
    return token;
};

export const clearTokens = () => {
    console.log("Clearing tokens");
    deleteCookie(COOKIE_CONFIG.accessToken.name);
    deleteCookie(COOKIE_CONFIG.refreshToken.name);
    console.log("Tokens cleared");
};

// Remember Me functionality
export const setRememberEmail = (email: string) => {
    setCookie("remember_email", email, {
        expires: 30, // 30 days
        path: "/",
    });
};

export const getRememberEmail = (): string | undefined => {
    return getCookie("remember_email");
};

export const clearRememberEmail = () => {
    deleteCookie("remember_email");
};

// LocalStorage utilities
// export const setLocalStorage = (key: string, value: any) => {
//     try {
//         localStorage.setItem(key, JSON.stringify(value));
//     } catch (error) {
//         console.error("Error setting localStorage:", error);
//     }
// };
//
// export const getLocalStorage = (key: string): any => {
//     try {
//         const item = localStorage.getItem(key);
//         return item ? JSON.parse(item) : null;
//     } catch (error) {
//         console.error("Error getting localStorage:", error);
//         return null;
//     }
// };
//
// export const removeLocalStorage = (key: string) => {
//     try {
//         localStorage.removeItem(key);
//     } catch (error) {
//         console.error("Error removing localStorage:", error);
//     }
// };
//
// export const clearLocalStorage = () => {
//     try {
//         localStorage.clear();
//     } catch (error) {
//         console.error("Error clearing localStorage:", error);
//     }
// };
