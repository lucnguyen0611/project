import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import type { AuthState } from "@/types/auth.types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { getAccessToken, getRememberEmail } from "@/utils/storage.utils";
import { getUserInfoFromToken, isTokenExpired } from "@/utils/jwt.utils";
import { authReducer, initialState } from "./auth.reducer";
import * as authService from "./auth.service";

interface AuthContextType extends AuthState {
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (name: string, email: string, password: string, role: "student" | "teacher") => Promise<void>;
    logout: () => void;
    clearError: () => void;
    getRememberEmail: () => string | undefined;
    refreshAuthToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const navigate = useNavigate();

    // Helper: kiểm tra role có phải teacher/admin không
    const isRoleTeacher = (user: any) => {
        if (!user) return false;
        const role = user?.role;
        return role === "teacher" || role === "admin";
    };

    // Check auth khi app khởi động
    useEffect(() => {
        const checkAuthOnStart = async () => {
            try {
                const accessToken = getAccessToken();

                // Nếu token hợp lệ thì decode và login locally
                if (accessToken && !isTokenExpired(accessToken)) {
                    const user = getUserInfoFromToken(accessToken);
                    if (user) {
                        dispatch({
                            type: "LOGIN_SUCCESS",
                            payload: {
                                user,
                                accessToken,
                                refreshToken: accessToken,
                                isTeacher: isRoleTeacher(user),
                            },
                        });
                        dispatch({ type: "AUTH_CHECK_COMPLETE" });
                        return;
                    }
                }

                // Thử refresh token qua backend
                const refreshed = await authService.refreshToken();
                if (refreshed) {
                    dispatch({
                        type: "LOGIN_SUCCESS",
                        payload: {
                            user: refreshed.user,
                            accessToken: refreshed.accessToken,
                            refreshToken: refreshed.refreshToken,
                            isTeacher: isRoleTeacher(refreshed.user),
                        },
                    });
                    dispatch({ type: "AUTH_CHECK_COMPLETE" });
                    return;
                }

                // Nếu không có token hoặc refresh thất bại -> logout và chuyển tới trang login
                authService.logout();
                dispatch({ type: "LOGOUT" });
                dispatch({ type: "AUTH_CHECK_COMPLETE" });
                navigate(ROUTES.LOGIN, { replace: true });
            } catch (error) {
                // Trong mọi lỗi fallback về logout
                authService.logout();
                dispatch({ type: "LOGOUT" });
                dispatch({ type: "AUTH_CHECK_COMPLETE" });
                navigate(ROUTES.LOGIN, { replace: true });
            }
        };

        void checkAuthOnStart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Lắng nghe event 'logout' (dùng window.dispatchEvent({ type: 'logout' }) từ chỗ khác)
    useEffect(() => {
        const handleLogout = () => {
            dispatch({ type: "LOGOUT" });
            authService.logout();
            navigate(ROUTES.LOGIN, { replace: true });
        };
        window.addEventListener("logout", handleLogout);
        return () => window.removeEventListener("logout", handleLogout);
    }, [navigate]);

    // Exposed helper để refresh token khi cần (ví dụ interceptor gọi)
    const refreshAuthToken = async (): Promise<boolean> => {
        try {
            const refreshed = await authService.refreshToken();
            if (refreshed) {
                dispatch({
                    type: "LOGIN_SUCCESS",
                    payload: {
                        user: refreshed.user,
                        accessToken: refreshed.accessToken,
                        refreshToken: refreshed.refreshToken,
                        isTeacher: isRoleTeacher(refreshed.user),
                    },
                });
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    // Login
    const login = async (email: string, password: string, rememberMe = false) => {
        try {
            dispatch({ type: "LOGIN_START" });
            const result = await authService.login(email, password, rememberMe);

            dispatch({
                type: "LOGIN_SUCCESS",
                payload: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    isTeacher: isRoleTeacher(result.user),
                },
            });

            window.dispatchEvent(
                new CustomEvent("showToast", {
                    detail: { message: "Đăng nhập thành công!", severity: "success" },
                })
            );

            navigate(ROUTES.CLASS_LIST);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Đăng nhập thất bại";
            dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
            throw error;
        }
    };

    // Register
    const register = async (
        name: string,
        email: string,
        password: string,
        role: "student" | "teacher"
    ) => {
        try {
            dispatch({ type: "REGISTER_START" });
            await authService.register(name, email, password, role);
            dispatch({ type: "REGISTER_SUCCESS" });

            window.dispatchEvent(
                new CustomEvent("showToast", {
                    detail: { message: "Đăng ký thành công! Vui lòng đăng nhập.", severity: "success" },
                })
            );

            // Điều hướng nhẹ sau khi register
            setTimeout(() => navigate(ROUTES.LOGIN), 800);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Đăng ký thất bại";
            dispatch({ type: "REGISTER_FAILURE", payload: errorMessage });
            throw error;
        }
    };

    // Logout
    const logout = () => {
        authService.logout();
        dispatch({ type: "LOGOUT" });

        window.dispatchEvent(
            new CustomEvent("showToast", {
                detail: { message: "Đăng xuất thành công!", severity: "info" },
            })
        );

        navigate(ROUTES.LOGIN, { replace: true });
    };

    const clearError = () => dispatch({ type: "CLEAR_ERROR" });

    const getRememberEmailFromStorage = () => getRememberEmail();

    // Kết hợp value cho context — bao gồm isTeacher từ state
    const value: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        clearError,
        getRememberEmail: getRememberEmailFromStorage,
        refreshAuthToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthProvider;
