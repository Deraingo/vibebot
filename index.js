import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDiscordBot } from "./src/bots/FinalsRoulette/DiscordBot.js";
import { initTwitchBot } from "./src/bots/Vibebot/TwitchBot.js";
import { PORT, ENABLE_EVENTSUB_WEBHOOKS } from "./src/config/env.js";
import { getStreamerChannels } from "./src/db/queries.js";
import cookieParser from "cookie-parser";
import { registerTwitchAuthRoutes } from "./src/routes/twitchAuth.js";
import { saveToken } from "./src/db/queries.js";
import { createRouletteFeature } from "./src/bots/FinalsRoulette/twitchFeature.js";
const features = [
  createRouletteFeature({ redemptionTitle: process.env.TWITCH_REDEMPTION_TITLE }),
];
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
  expressApp: app,
  webhookSecret: process.env.TWITCH_WEBHOOK_SECRET,
  features,
});

registerTwitchAuthRoutes(app, {
  authProvider: twitchBot.authProvider,
  apiClient: twitchBot.apiClient,
  chatClient: twitchBot.chatClient,
  subscribeChannel: twitchBot.subscribeChannel,
  saveToken,
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