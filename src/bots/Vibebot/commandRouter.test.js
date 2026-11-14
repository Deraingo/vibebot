import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCommand } from "./commandRouter.js";

test("non-commands return null", () => {
  assert.equal(parseCommand("just chatting"), null);
  assert.equal(parseCommand("!"), null);
  assert.equal(parseCommand(""), null);
});

test("command is lowercased", () => {
  assert.equal(parseCommand("?QUOTE 3").command, "quote");
});

test("argsText keeps the original inner spacing", () => {
  const parsed = parseCommand("?quote add   lots   of  spaces");
  assert.deepEqual(parsed.args, ["add", "lots", "of", "spaces"]);
  assert.equal(parsed.argsText, "add   lots   of  spaces");
});

test("no args gives an empty list", () => {
  assert.deepEqual(parseCommand("?quote").args, []);
});