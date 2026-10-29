import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

function TestConsumer() {
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) {
    return <div>loading</div>;
  }

  return (
    <>
      <div>{user ? user.email : "logged-out"}</div>
      <button onClick={() => loginWithGoogle("google-id-token")}>Continue with Google</button>
    </>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("keeps the saved token even when the session check fails", async () => {
    localStorage.setItem("token", "saved-token");
    api.get.mockRejectedValue({
      response: {
        data: {
          message: "Invalid or expired token",
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("logged-out")).toBeInTheDocument();
    });

    expect(localStorage.getItem("token")).toBe("saved-token");
  });

  it("sends the Google credential to the backend and persists the returned session", async () => {
    api.get.mockRejectedValue(new Error("Not logged in"));
    api.post.mockResolvedValue({
      data: {
        token: "google-session-token",
        user: { id: "user-1", email: "google@example.com", role: "user" },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(screen.getByText("google@example.com")).toBeInTheDocument();
    });

    expect(api.post).toHaveBeenCalledWith("/auth/google", { idToken: "google-id-token" });
    expect(localStorage.getItem("token")).toBe("google-session-token");
    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      id: "user-1",
      email: "google@example.com",
      role: "user",
    });
  });

});
