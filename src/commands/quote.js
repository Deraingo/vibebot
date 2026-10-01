import { addQuote, getQuoteByNumber, getRandomQuote } from "../db/quoteQueries.js";
const MAX_QUOTE_LENGTH = 490;
const QUOTE_NUMBER_PATTERN = /^\d+$/
const USAGE = "Usage: !quote <number> | !quote add <text>";

function formatQuote(quote) {
  return `#${quote.quote_number}: "${quote.quote_text}"`;
}

async function addQuoteCommand({ channelId, userName, isMod, argsText }) {
  if (!isMod) return "Only mods can add quotes.";
  const quoteText = argsText.slice("add".length).trim();
  if (!quoteText) return "Usage: !quote add <text>";
  if (quoteText.length > MAX_QUOTE_LENGTH) return `Quotes max out at ${MAX_QUOTE_LENGTH} characters.`;
  const quoteNumber = await addQuote(channelId, quoteText, userName);
  return `Added quote #${quoteNumber}`;
}

async function handleQuote(context) {
    const {channelId, args} = context
    if (!channelId) return null;
    const [subcommand] = args
    if (subcommand === undefined) {
        const quote = await getRandomQuote(channelId);
        return quote ? formatQuote(quote) : "No quotes yet — add one with !quote add <text>";
    }
    if (subcommand.toLowerCase() === "add") return addQuoteCommand(context);
    if (!QUOTE_NUMBER_PATTERN.test(subcommand)) return USAGE;

    const quoteNumber = Number(subcommand);
    const quote = await getQuoteByNumber(channelId, quoteNumber);
    return quote ? formatQuote(quote) : `Quote #${quoteNumber} doesn't exist.`;
}

export const quoteFeature = {
  name: "quotes",
  chatCommands: { quote: handleQuote },
};