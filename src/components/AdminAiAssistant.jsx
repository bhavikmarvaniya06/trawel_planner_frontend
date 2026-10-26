import { useState, useRef, useEffect } from "react";
import {
    Sparkles,
    Send,
    X,
    Check,
    AlertTriangle,
    RefreshCw,
    Bot,
    User,
} from "lucide-react";
import api from "../services/api";
import "./AdminAiAssistant.css";

function AdminAiAssistant({ isOpen, onClose, onActionExecuted }) {
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            sender: "assistant",
            text: "Hello Administrator! Ask me anything about your platform in your own words. I can answer questions using the admin database, and I will ask you to confirm before making any changes.\n\n*You can write in English or Hindi.*",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmingActionId, setConfirmingActionId] = useState(null);
    const [actionFeedback, setActionFeedback] = useState({});
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    useEffect(() => {
        if (typeof chatEndRef.current?.scrollIntoView === "function") {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading]);

    if (!isOpen) return null;

    const sendMessage = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        const userMsg = {
            id: `usr_${Date.now()}`,
            sender: "user",
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({ sender: m.sender, text: m.text }));

            const response = await api.post("/admin/assistant/chat", {
                message: query,
                history,
            });

            const assistantMsg = {
                id: `ast_${Date.now()}`,
                sender: "assistant",
                text: response.data.reply || "Action completed.",
                pendingAction: response.data.pendingAction || null,
                provider: response.data.provider || "built-in",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            console.error("AI Assistant request error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `err_${Date.now()}`,
                    sender: "assistant",
                    text: `⚠️ Error: ${error.response?.data?.message || "Could not reach the AI Assistant service. Please verify your backend server is running."}`,
                    isError: true,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async (actionId, confirmed) => {
        setConfirmingActionId(actionId);
        try {
            const response = await api.post("/admin/assistant/confirm", {
                actionId,
                confirmed,
            });

            setActionFeedback((prev) => ({
                ...prev,
                [actionId]: {
                    status: confirmed ? "confirmed" : "cancelled",
                    message: response.data.message || (confirmed ? "Action executed successfully!" : "Action cancelled."),
                },
            }));

            // Notify parent dashboard to refresh live data
            if (confirmed && onActionExecuted) {
                onActionExecuted();
            }

            // Append assistant confirmation note
            setMessages((prev) => [
                ...prev,
                {
                    id: `conf_${Date.now()}`,
                    sender: "assistant",
                    text: confirmed
                        ? `✅ **Action Confirmed and Executed**: ${response.data.message}\nYour dashboard collections have been updated.`
                        : `❌ **Action Cancelled**: The proposed database modification was discarded. No changes were made.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } catch (error) {
            console.error("Confirmation error:", error);
            setActionFeedback((prev) => ({
                ...prev,
                [actionId]: {
                    status: "error",
                    message: error.response?.data?.message || "Failed to execute database modification.",
                },
            }));
        } finally {
            setConfirmingActionId(null);
        }
    };

    const formatMarkdownText = (rawText) => {
        if (!rawText) return null;

        // Split by lines to render headers, bullets, and paragraphs
        const lines = rawText.split("\n");
        return lines.map((line, idx) => {
            if (line.startsWith("### ")) {
                return <h3 key={idx} className="ai-md-h3">{line.replace("### ", "")}</h3>;
            }
            if (line.startsWith("#### ")) {
                return <h4 key={idx} className="ai-md-h4">{line.replace("#### ", "")}</h4>;
            }
            if (line.startsWith("- ") || line.startsWith("• ")) {
                return (
                    <li key={idx} className="ai-md-li">
                        {renderBoldSpans(line.replace(/^[-•]\s*/, ""))}
                    </li>
                );
            }
            if (/^\d+\.\s/.test(line)) {
                return (
                    <div key={idx} className="ai-md-num">
                        {renderBoldSpans(line)}
                    </div>
                );
            }
            if (!line.trim()) {
                return <div key={idx} className="ai-md-spacer" />;
            }
            return <p key={idx} className="ai-md-p">{renderBoldSpans(line)}</p>;
        });
    };

    const renderBoldSpans = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <aside className="ai-assistant-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-assistant-heading">
            <div className="ai-assistant-header">
                <div className="ai-assistant-title-group">
                    <div className="ai-assistant-badge">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h2 id="ai-assistant-heading">AI Admin Assistant</h2>
                        <span className="ai-assistant-subtitle">Conversational admin assistant</span>
                    </div>
                </div>
                <button
                    type="button"
                    className="ai-assistant-close"
                    aria-label="Close assistant"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="ai-assistant-messages">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`ai-message-row ${msg.sender === "user" ? "user-row" : "assistant-row"}`}
                    >
                        <div className="ai-message-avatar">
                            {msg.sender === "user" ? <User size={15} /> : <Bot size={15} />}
                        </div>
                        <div className={`ai-message-bubble ${msg.sender} ${msg.isError ? "is-error" : ""}`}>
                            <div className="ai-message-content">
                                {formatMarkdownText(msg.text)}
                            </div>

                            {/* PENDING DATABASE ACTION CONFIRMATION CARD */}
                            {msg.pendingAction && (
                                <div className="pending-action-card">
                                    <div className="pending-action-header">
                                        <AlertTriangle size={18} className="pending-warning-icon" />
                                        <div>
                                            <strong>Confirmation Required</strong>
                                            <span>Database modification proposed</span>
                                        </div>
                                    </div>
                                    <div className="pending-action-body">
                                        <div className="pending-action-title">{msg.pendingAction.title}</div>
                                        <p className="pending-action-desc">{msg.pendingAction.description}</p>
                                        {msg.pendingAction.data && (
                                            <div className="pending-action-fields">
                                                {Object.entries(msg.pendingAction.data).map(([key, val]) => (
                                                    <div key={key} className="pending-field-row">
                                                        <span className="pending-field-key">{key}:</span>
                                                        <span className="pending-field-val">
                                                            {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val || "—")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {actionFeedback[msg.pendingAction.actionId] ? (
                                        <div className={`action-result-badge ${actionFeedback[msg.pendingAction.actionId].status}`}>
                                            {actionFeedback[msg.pendingAction.actionId].status === "confirmed" && <Check size={16} />}
                                            {actionFeedback[msg.pendingAction.actionId].message}
                                        </div>
                                    ) : (
                                        <div className="pending-action-buttons">
                                            <button
                                                type="button"
                                                className="btn-confirm-action"
                                                onClick={() => handleConfirmAction(msg.pendingAction.actionId, true)}
                                                disabled={confirmingActionId === msg.pendingAction.actionId}
                                            >
                                                {confirmingActionId === msg.pendingAction.actionId ? (
                                                    <>
                                                        <RefreshCw size={15} className="spin-icon" /> Applying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={16} /> Confirm & Execute
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-cancel-action"
                                                onClick={() => handleConfirmAction(msg.pendingAction.actionId, false)}
                                                disabled={confirmingActionId === msg.pendingAction.actionId}
                                            >
                                                <X size={15} /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <span className="ai-message-time">{msg.timestamp}</span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="ai-message-row assistant-row">
                        <div className="ai-message-avatar">
                            <Bot size={15} />
                        </div>
                        <div className="ai-message-bubble assistant loading-bubble">
                            <span className="ai-typing-dot"></span>
                            <span className="ai-typing-dot"></span>
                            <span className="ai-typing-dot"></span>
                            <span className="ai-typing-text">Analyzing database and preparing response...</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form
                className="ai-assistant-input-area"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about users, trips, or your platform..."
                    disabled={loading}
                    maxLength={1000}
                />
                <button
                    type="submit"
                    className="ai-send-btn"
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                >
                    <Send size={17} />
                </button>
            </form>
        </aside>
    );
}

export default AdminAiAssistant;
