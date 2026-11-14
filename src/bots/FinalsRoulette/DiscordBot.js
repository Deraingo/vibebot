import { Client, GatewayIntentBits } from "discord.js";
import { sendLoadout } from "../../commands/roulette.js";
import { sendHelp } from "../../commands/help.js";
export function initDiscordBot(discord_token) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once("clientReady", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith("!roulette")) {
      await sendLoadout(message);
    }
    if (message.content.startsWith("!help")) {
      await sendHelp(message);
    }
  });
  client.login(discord_token);
}
