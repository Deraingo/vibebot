const COMMAND_PREFIX = "!";

export function parseCommand(messageText) {
  if (typeof messageText !== "string") return null;
  const trimmed = messageText.trim();
  if (!trimmed.startsWith(COMMAND_PREFIX)) return null;

  const [rawCommand, ...args] = trimmed.slice(COMMAND_PREFIX.length).split(/\s+/);
  if (!rawCommand) return null;

  const argsText = trimmed.slice(COMMAND_PREFIX.length + rawCommand.length).trim();
  return { command: rawCommand.toLowerCase(), args, argsText };
}