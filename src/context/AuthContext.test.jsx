import { render, screen, waitFor } from "@testing-library/react";
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
  const { user, loading } = useAuth();

  if (loading) {
    return <div>loading</div>;
  }

  return <div>{user ? user.email : "logged-out"}</div>;
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
});
