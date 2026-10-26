# Google Sign-In deployment

This frontend uses Google Identity Services. Its OAuth Web application Client ID is embedded into the static frontend bundle at build time.

## Vercel

In the Vercel project for `trawel_planner_frontend`, add these Production environment variables:

| Name | Value |
| --- | --- |
| `REACT_APP_GOOGLE_CLIENT_ID` | The Google OAuth 2.0 **Web application Client ID**, ending in `.apps.googleusercontent.com` |
| `REACT_APP_API_URL` | `https://trawel-planner-backend.onrender.com/api` |

Redeploy the frontend after changing either variable. A runtime-only change does not update an already-built bundle.

## Google Cloud Console

In **APIs & Services → Credentials**, edit the same Web application OAuth client and add this exact entry under **Authorized JavaScript origins**:

```text
https://trawel-planner-frontend.vercel.app
```

Add any custom production domain as a separate origin. Do not include a path or trailing slash. This app uses the GIS credential callback flow and does not require a redirect URI.

The Client ID is public configuration needed by the browser. Never put a Google Client Secret in this frontend repository or in a `REACT_APP_*` variable.
