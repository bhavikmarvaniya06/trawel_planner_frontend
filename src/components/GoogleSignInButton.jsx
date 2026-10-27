import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityServices() {
    if (window.google?.accounts?.id) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let script = document.getElementById(GOOGLE_SCRIPT_ID);
        let shouldAppend = false;

        if (!script) {
            script = document.createElement("script");
            script.id = GOOGLE_SCRIPT_ID;
            script.src = GOOGLE_SCRIPT_URL;
            script.async = true;
            script.defer = true;
            shouldAppend = true;
        }

        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", reject, { once: true });

        if (shouldAppend) {
            document.head.appendChild(script);
        }
    });
}

function GoogleSignInButton({ onCredential, disabled = false }) {
    const buttonRef = useRef(null);
    const onCredentialRef = useRef(onCredential);
    const [loadError, setLoadError] = useState(false);
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim();

    onCredentialRef.current = onCredential;

    useEffect(() => {
        if (!clientId || disabled || !buttonRef.current) {
            return undefined;
        }

        let active = true;

        loadGoogleIdentityServices()
            .then(() => {
                if (!active || !buttonRef.current || !window.google?.accounts?.id) {
                    return;
                }

                buttonRef.current.innerHTML = "";
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => {
                        if (response.credential) {
                            onCredentialRef.current(response.credential);
                        }
                    },
                    auto_select: false,
                });
                window.google.accounts.id.renderButton(buttonRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    width: Math.min(320, buttonRef.current.clientWidth || 320),
                });
            })
            .catch(() => {
                if (active) {
                    setLoadError(true);
                }
            });

        return () => {
            active = false;
        };
    }, [clientId, disabled]);

    return (
        <>
            {clientId ? (
                loadError
                    ? <p className="auth-google-message" role="status">Google sign-in could not load. Please refresh and try again.</p>
                    : (
                        <div
                            className={`auth-google-button${disabled ? " is-disabled" : ""}`}
                            ref={buttonRef}
                            aria-label="Continue with Google"
                            aria-disabled={disabled}
                        />
                    )
            ) : (
                <p className="auth-google-message" role="status">
                    Google sign-in is not configured for this deployment. Set
                    {" "}REACT_APP_GOOGLE_CLIENT_ID in your frontend hosting environment, then rebuild and redeploy the frontend.
                </p>
            )}
            <div className="auth-divider" aria-hidden="true">or</div>
        </>
    );
}

export default GoogleSignInButton;
