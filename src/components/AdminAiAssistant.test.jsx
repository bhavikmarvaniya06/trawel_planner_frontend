import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminAiAssistant from "./AdminAiAssistant";
import api from "../services/api";

jest.mock("../services/api", () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

describe("AdminAiAssistant", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders a free-form assistant without quick prompts", () => {
        render(<AdminAiAssistant isOpen={true} onClose={jest.fn()} onActionExecuted={jest.fn()} />);

        expect(screen.getByRole("heading", { name: /ai admin assistant/i })).toBeInTheDocument();
        expect(screen.getByText(/ask me anything about your platform/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ask anything about users/i)).toBeInTheDocument();
        expect(screen.queryByText("Quick actions:")).not.toBeInTheDocument();
    });

    test("does not render when isOpen is false", () => {
        const { container } = render(<AdminAiAssistant isOpen={false} onClose={jest.fn()} onActionExecuted={jest.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    test("sends message and renders assistant reply", async () => {
        api.post.mockResolvedValueOnce({
            data: {
                success: true,
                reply: "### 📊 Platform Metrics\n- Total Users: 15\n- Total Trips: 8",
                provider: "built-in",
            },
        });

        render(<AdminAiAssistant isOpen={true} onClose={jest.fn()} onActionExecuted={jest.fn()} />);

        const input = screen.getByPlaceholderText(/ask anything about users/i);
        fireEvent.change(input, { target: { value: "How many users registered on October 29?" } });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));

        expect(await screen.findByRole("heading", { name: /Platform Metrics/i })).toBeInTheDocument();
        expect(screen.getByText(/Total Users: 15/i)).toBeInTheDocument();
    });

    test("renders confirmation card when a database action is pending and executes confirmation", async () => {
        const onActionExecutedMock = jest.fn();

        api.post
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    reply: "I have prepared a proposal to add Bali.",
                    pendingAction: {
                        actionId: "act_test_123",
                        type: "create_destination",
                        title: "Create Destination: Bali",
                        description: "Add Bali in Indonesia to featured destinations.",
                        data: { name: "Bali", country: "Indonesia", active: true },
                    },
                    provider: "openai",
                },
            })
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Destination "Bali" created successfully in the database.',
                },
            });

        render(<AdminAiAssistant isOpen={true} onClose={jest.fn()} onActionExecuted={onActionExecutedMock} />);

        const input = screen.getByPlaceholderText(/ask anything about users/i);
        fireEvent.change(input, { target: { value: "add destination Bali, Indonesia" } });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));

        expect(await screen.findByText("Confirmation Required")).toBeInTheDocument();
        expect(screen.getByText("Create Destination: Bali")).toBeInTheDocument();

        // Click Confirm & Execute
        const confirmBtn = screen.getByRole("button", { name: /confirm & execute/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/admin/assistant/confirm", {
                actionId: "act_test_123",
                confirmed: true,
            });
            expect(onActionExecutedMock).toHaveBeenCalled();
        });
    });

    test("cancels a pending database action when Cancel is clicked", async () => {
        const onActionExecutedMock = jest.fn();

        api.post
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    reply: "I have prepared a proposal to delete Kyoto.",
                    pendingAction: {
                        actionId: "act_del_456",
                        type: "delete_destination",
                        title: "Delete Destination: Kyoto",
                        description: "Permanently delete Kyoto.",
                        data: { name: "Kyoto" },
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    success: true,
                    cancelled: true,
                    message: "Cancelled action: Delete Destination: Kyoto.",
                },
            });

        render(<AdminAiAssistant isOpen={true} onClose={jest.fn()} onActionExecuted={onActionExecutedMock} />);

        const input = screen.getByPlaceholderText(/ask anything about users/i);
        fireEvent.change(input, { target: { value: "delete destination Kyoto" } });
        fireEvent.click(screen.getByRole("button", { name: /send message/i }));

        expect(await screen.findByText("Confirmation Required")).toBeInTheDocument();

        // Click Cancel
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/admin/assistant/confirm", {
                actionId: "act_del_456",
                confirmed: false,
            });
            expect(onActionExecutedMock).not.toHaveBeenCalled();
        });
    });
});
