import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "../context/AuthContext";
import OtpLogin from "./OtpLogin";

jest.mock("react-router-dom", () => ({
    Link: "a",
    useNavigate: () => jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(),
}));

describe("OtpLogin", () => {
    const requestOtp = jest.fn();
    const loginWithOtp = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ requestOtp, loginWithOtp });
    });

    const renderOtpLogin = () =>
        render(<OtpLogin />);

    it("shows an error and does not reveal an OTP when email delivery fails", async () => {
        requestOtp.mockRejectedValue({
            response: {
                data: {
                    message: "The email provider rejected the sender credentials. For Gmail, use a valid App Password in EMAIL_PASS.",
                },
            },
        });
        renderOtpLogin();

        fireEvent.change(screen.getByPlaceholderText("Enter your registered email"), {
            target: { value: "traveler@example.com" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

        expect(
            await screen.findByText(/email provider rejected the sender credentials/)
        ).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("Enter 6-digit OTP")).not.toBeInTheDocument();
        expect(screen.queryByText(/Development code/)).not.toBeInTheDocument();
    });

    it("resets the verification step when the email changes", async () => {
        requestOtp.mockResolvedValue({ message: "OTP sent." });
        renderOtpLogin();

        const emailInput = screen.getByPlaceholderText("Enter your registered email");
        fireEvent.change(emailInput, { target: { value: "traveler@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Enter 6-digit OTP")).toBeInTheDocument();
        });

        fireEvent.change(emailInput, { target: { value: "another@example.com" } });

        expect(screen.queryByPlaceholderText("Enter 6-digit OTP")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Send OTP" })).toBeInTheDocument();
    });
});
