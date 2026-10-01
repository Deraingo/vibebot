import { generateRandomLoadout } from "../../data/loadoutGenerator.js";
import { formatForTwitch } from "../../utils/formatters.js";

export function createRouletteFeature({ redemptionTitle }) {
  return {
    name: "roulette",
    onRedemption(event) {
      if (event.rewardTitle !== redemptionTitle) return null;
      return formatForTwitch(generateRandomLoadout());
    },
  };
}