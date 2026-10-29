import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);


    // Check logged-in user
    useEffect(() => {

        const restoreSession = async () => {
            const token = localStorage.getItem("token");
            const savedUser = localStorage.getItem("user");

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }

            try {
                const response = await api.get("/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const authenticatedUser = response.data.user;

                localStorage.setItem("user", JSON.stringify(authenticatedUser));
                setUser(authenticatedUser);
            } catch (error) {
                console.warn(
                    "Session restore failed:",
                    error.response?.data?.message || error.message
                );

                // Preserve the user session unless the user explicitly logs out.
                // This prevents a transient API issue from forcing a false logout.
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } finally {
                setLoading(false);
            }
        };

        restoreSession();

    }, []);


    // Login
    const login = async (email, password) => {

        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);

        return response.data;
    };


    // Register
    const register = async (name, email, password) => {

        const response = await api.post("/auth/register", {
            name,
            email,
            password,
        });

        return response.data;
    };

    const loginWithGoogle = async (idToken) => {
        const response = await api.post("/auth/google", { idToken });

        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        return response.data;
    };


    // Logout
    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};