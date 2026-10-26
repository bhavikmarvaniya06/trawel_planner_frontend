import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLoginWithGoogle = jest.fn();

jest.mock("../context/AuthContext", () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister,
        loginWithGoogle: mockLoginWithGoogle,
    }),
}));

jest.mock("../components/GoogleSignInButton", () => {
    const React = require("react");

    return function MockGoogleSignInButton({ onCredential }) {
        return React.createElement(
            "button",
            { type: "button", onClick: () => onCredential("google-id-token") },
            "Continue with Google"
        );
    };
});

const renderAuthPage = (path, page) => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>
            <Route path="/login" element={page === "login" ? <Login /> : <div>Login page</div>} />
            <Route path="/register" element={page === "register" ? <Register /> : <div>Register page</div>} />
            <Route path="/planner" element={<div>Planner destination</div>} />
            <Route path="/admin" element={<div>Admin destination</div>} />
        </Routes>
    </MemoryRouter>
);

beforeEach(() => {
    jest.clearAllMocks();
    mockLoginWithGoogle.mockResolvedValue({
        user: { role: "user" },
    });
});

test("login page authenticates with Google and routes to the planner", async () => {
    renderAuthPage("/login", "login");

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledWith("google-id-token");
    });
    expect(await screen.findByText("Planner destination")).toBeInTheDocument();
});

test("register page supports Google account creation and signs in the new account", async () => {
    renderAuthPage("/register", "register");

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledWith("google-id-token");
    });
    expect(await screen.findByText("Planner destination")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
});

test("login page sends Google-linked administrators to the admin dashboard", async () => {
    mockLoginWithGoogle.mockResolvedValue({
        user: { role: "admin" },
    });
    renderAuthPage("/login", "login");

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByText("Admin destination")).toBeInTheDocument();
});
