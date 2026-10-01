import { ApiClient } from "@twurple/api";
import { EventSubMiddleware } from "@twurple/eventsub-http";
import { ChatClient } from "@twurple/chat";
import { buildAuthProvider } from "../../auth/twitchAuth.js";
import { PUBLIC_HOST } from "../../config/env.js";
import { parseCommand } from "./commandRouter.js";
export async function initTwitchBot(config) {
  const {
    clientId,
    clientSecret,
    channels,
    channelIds,
    expressApp,
    webhookSecret,
    features
  } = config;

  const authProvider = await buildAuthProvider({ clientId, clientSecret });
  const apiClient = new ApiClient({ authProvider });
  const chatClient = new ChatClient({ authProvider, channels });

  const hostName = PUBLIC_HOST.replace(/^https?:\/\//, "");

  console.log(`   EventSub Config:`);
  console.log(`   Hostname: ${hostName}`);
  console.log(`   Webhook URL: https://${hostName}/eventsub`);
  console.log(`   Secret configured: ${webhookSecret ? "Yes" : "No"}`);

  const eventSub = new EventSubMiddleware({
    apiClient,
    hostName,
    pathPrefix: "/eventsub",
    secret: webhookSecret,
  });

  await eventSub.apply(expressApp);
  const chatCommands = new Map();
  for (const feature of features) {
    for (const [commandName, handler] of Object.entries(feature.chatCommands ?? {})) {
      if (chatCommands.has(commandName)) throw new Error(`Two features claim !${commandName}`);
      chatCommands.set(commandName, handler);
    }
  }

  chatClient.onMessage(async (channel, user, text, msg) => {
    const parsed = parseCommand(text);
    if (!parsed) return;
    const handler = chatCommands.get(parsed.command);
    if (!handler) return;

    try {
      const reply = await handler({
        channelId: msg.channelId,
        userName: user,
        isMod: msg.userInfo.isMod || msg.userInfo.isBroadcaster,
        args: parsed.args,
        argsText: parsed.argsText,
      });
      if (reply) await chatClient.say(channel, reply, { replyTo: msg });
    } catch (error) {
      console.error(`❌ !${parsed.command} failed in ${channel}:`, error);
    }
  });
  await chatClient.connect();

  console.log(`✅ Twitch bot connected`);
  console.log(`...Listening to channels: ${channels.join(", ")}`);
  console.log(`....Features: ${features.map((feature) => feature.name).join(", ")}`);
  async function subscribeChannel(channelId, channelName) {
    await eventSub.onChannelRedemptionAdd(channelId, async (event) => {
      console.log(`- Redemption received: "${event.rewardTitle}" by ${event.userName} in ${channelName}`);
      for (const feature of features) {
        if (!feature.onRedemption) continue;
        try {
          const reply = await feature.onRedemption(event);
          if (reply) await chatClient.say(channelName, reply);
        } catch (error) {
          console.error(`❌ ${feature.name} failed on redemption in ${channelName}:`, error);
        }
      }
    });
  }
  async function subscribe() {
    console.log(`...Creating EventSub subscriptions for ${channelIds.length} channels...`);
    for (const [index, channelId] of channelIds.entries()) {
      try {
        await subscribeChannel(channelId, channels[index]);
        console.log(`   ✅ Subscription created for ${channels[index]}`);
      } catch (error) {
        console.error(`   ❌ Failed to subscribe to ${channels[index]}:`, error);
      }
    }
    console.log(`✅ EventSub webhooks ready at /eventsub`);
  }
  return {
    eventSub, authProvider, apiClient, chatClient, subscribe, subscribeChannel
  }
}
