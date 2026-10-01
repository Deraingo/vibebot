import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDiscordBot } from "./src/bots/DiscordBot.js";
import { initTwitchBot } from "./src/bots/TwitchBot.js";
import { PORT, ENABLE_EVENTSUB_WEBHOOKS } from "./src/config/env.js";
import { getStreamerChannels } from "./src/db/queries.js";
import cookieParser from "cookie-parser";
import { registerTwitchAuthRoutes } from "./src/routes/twitchAuth.js";
import { saveToken } from "./src/db/queries.js";
import { generateRandomLoadout } from "./src/data/loadoutGenerator.js";
import { formatForTwitch } from "./src/utils/formatters.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "client", "dist");

const app = express();
app.use(cookieParser())
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});
app.get("/health", (req, res) => {
  res.send("Vibebot is running!");
});

const streamers = await getStreamerChannels();
const channels = streamers.map(s => s.username);
const channelIds = streamers.map(s => s.user_id);

const twitchBot = await initTwitchBot({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  channels,
  channelIds,
  redemptionTitle: process.env.TWITCH_REDEMPTION_TITLE,
  expressApp: app,
  webhookSecret: process.env.TWITCH_WEBHOOK_SECRET,
});

registerTwitchAuthRoutes(app, {
  authProvider: twitchBot.authProvider,
  apiClient: twitchBot.apiClient,
  chatClient: twitchBot.chatClient,
  eventSub: twitchBot.eventSub,
  saveToken,
  redemptionTitle: process.env.TWITCH_REDEMPTION_TITLE,
  generateRandomLoadout,
  formatForTwitch,
});

// (Track B routes will go here — between bot init and static/fallback)
app.use(express.static(clientDist));

app.use((req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, async () => {
  if (ENABLE_EVENTSUB_WEBHOOKS) {
    twitchBot.eventSub.markAsReady();
    await twitchBot.subscribe();
  } else {
    console.log("⚠️  EventSub webhooks disabled (dev) — chat only");
  }
});

initDiscordBot(process.env.DISCORD_TOKEN);