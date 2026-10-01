import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { TWITCH_REDIRECT_URI, SESSION_SECRET, IS_PROD, ENABLE_EVENTSUB_WEBHOOKS } from "../config/env.js";
const STATE_COOKIE = "twitch_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function signState(state) {
  const mac = createHmac("sha256", SESSION_SECRET).update(state).digest("hex");
  return `${state}.${mac}`;
}

function verifyState(signed) {
  if (!signed || typeof signed !== "string") return null;
  const [state, mac] = signed.split(".");
  if (!state || !mac) return null;

  const expected = createHmac("sha256", SESSION_SECRET).update(state).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? state : null;
}

export function registerTwitchAuthRoutes(app, {
  authProvider,
  apiClient,
  chatClient,
  subscribeChannel,
  saveToken,
}) {
  console.log("DEBUG: registerTwitchAuthRoutes called");
  app.get("/auth/twitch/login", (req, res) => {
    console.log("DEBUG: /auth/twitch/login handler hit");
    const state = randomUUID();
    const signed = signState(state);

    res.cookie(STATE_COOKIE, signed, {
      httpOnly: true,   
      secure: IS_PROD,   
      sameSite: "lax",        
      maxAge: STATE_TTL_MS,
      path: "/auth/twitch",    
    });

    const scopes = ["chat:read", "chat:edit", "channel:read:redemptions"];
    const url = new URL("https://id.twitch.tv/oauth2/authorize");
    url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
    url.searchParams.set("redirect_uri", TWITCH_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("force_verify", "true"); 

    res.redirect(url.toString());
  });

  app.get("/auth/twitch/callback", async (req, res) => {
    const { code, state: returnedState, error } = req.query;
    if (error) {
      return res.redirect(`/?bot_added=error&reason=${encodeURIComponent(error)}`);
    }
    const signed = req.cookies?.[STATE_COOKIE];
    const expectedState = verifyState(signed);
    res.clearCookie(STATE_COOKIE, { path: "/auth/twitch" });

    if (!expectedState || expectedState !== returnedState) {
      return res.redirect("/?bot_added=error&reason=invalid_state");
    }

    try {
      const userId = await authProvider.addUserForCode(code, []);
      const user = await apiClient.users.getUserById(userId);
      const token = await authProvider.getAccessTokenForUser(userId);
      await saveToken(userId, user.name, token, false);
      await chatClient.join(user.name);
      if (ENABLE_EVENTSUB_WEBHOOKS) await subscribeChannel(userId, user.name)
      

      res.redirect(`/?bot_added=success&channel=${encodeURIComponent(user.name)}`);
    } catch (err) {
      console.error("OAuth callback failed:", err.message);  
      res.redirect("/?bot_added=error&reason=server_error");
    }
  });
}