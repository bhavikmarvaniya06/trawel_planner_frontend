import { render, screen, waitFor } from "@testing-library/react";
import GoogleSignInButton from "./GoogleSignInButton";

describe("GoogleSignInButton", () => {
    const originalClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");

    beforeEach(() => {
        process.env.REACT_APP_GOOGLE_CLIENT_ID = "tripai-web-client-id";
        window.google = {
            accounts: {
                id: {
                    initialize: jest.fn(),
                    renderButton: jest.fn(),
                },
            },
        };
    });

    afterEach(() => {
        if (originalClientId === undefined) {
            delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
        } else {
            process.env.REACT_APP_GOOGLE_CLIENT_ID = originalClientId;
        }

        delete window.google;
        Object.defineProperty(window, "location", originalLocationDescriptor);
    });

    test("renders the Google button and passes its signed credential to the page", async () => {
        const onCredential = jest.fn();

        render(<GoogleSignInButton onCredential={onCredential} />);

        await waitFor(() => {
            expect(window.google.accounts.id.renderButton).toHaveBeenCalled();
        });

        const initialization = window.google.accounts.id.initialize.mock.calls[0][0];
        expect(initialization.client_id).toBe("tripai-web-client-id");
        initialization.callback({ credential: "signed-google-id-token" });

        expect(onCredential).toHaveBeenCalledWith("signed-google-id-token");
        expect(window.google.accounts.id.renderButton.mock.calls[0][1].text).toBe("continue_with");
    });

    test("directs deployed users to configure the hosting build environment", () => {
        delete process.env.REACT_APP_GOOGLE_CLIENT_ID;
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { ...window.location, hostname: "travel.example.com" },
        });

        render(<GoogleSignInButton onCredential={jest.fn()} />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Set REACT_APP_GOOGLE_CLIENT_ID in your frontend hosting environment"
        );
        expect(screen.getByRole("status")).toHaveTextContent("rebuild and redeploy");
    });

    test("directs local users to configure and restart the frontend", () => {
        delete process.env.REACT_APP_GOOGLE_CLIENT_ID;

        render(<GoogleSignInButton onCredential={jest.fn()} />);

        expect(screen.getByRole("status")).toHaveTextContent("in frontend/.env");
        expect(screen.getByRole("status")).toHaveTextContent("restart the frontend");
    });
});
