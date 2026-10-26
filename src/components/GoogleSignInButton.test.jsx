import { render, waitFor } from "@testing-library/react";
import GoogleSignInButton from "./GoogleSignInButton";

describe("GoogleSignInButton", () => {
    const originalClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

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
});
