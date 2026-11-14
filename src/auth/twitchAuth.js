import {
  TWITCH_REDIRECT_URI,
  SESSION_SECRET,
  IS_PROD,
} from "../config/env.js";
import { RefreshingAuthProvider } from "@twurple/auth";
import { saveToken, getAllTokens } from "../db/queries.js";

export async function buildAuthProvider({ clientId, clientSecret}) {
  const authProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
    redirectUri: TWITCH_REDIRECT_URI
  });

  authProvider.onRefresh(async (userId, newTokenData) => {
    const existing = (await getAllTokens()).find((r) => r.user_id === userId);
    await saveToken(
      userId,
      existing?.username ?? "unknown",
      newTokenData,
      existing?.is_bot ?? false
    );
  });

  for (const row of await getAllTokens()) {
    const tokenData = {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      scope: row.scope,
      expiresIn: row.expires_in,
      obtainmentTimestamp: Number(row.obtainment_timestamp),
    };
    const intents = row.is_bot ? ["chat"] : [];
    authProvider.addUser(row.user_id, tokenData, intents);
  }

  return authProvider;
}
