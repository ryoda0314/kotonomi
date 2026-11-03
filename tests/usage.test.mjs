import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere } from "../src/lib/usage.ts";

const SITE = "https://kotonomi.example.app";

test("counted in a production build at the public address", () => {
  assert.equal(countsHere(SITE, SITE, true), true);
  assert.equal(countsHere(SITE, `${SITE}/`, true), true);
  assert.equal(countsHere(SITE, `${SITE}/app?from=home`, true), true);
});

test("not while developing, on this computer, on a preview or at another address", () => {
  assert.equal(countsHere(SITE, SITE, false), false);
  assert.equal(countsHere("http://localhost:3250", SITE, true), false);
  assert.equal(countsHere("https://kotonomi-git-try.example.app", SITE, true), false);
  assert.equal(countsHere("http://kotonomi.example.app", SITE, true), false);
});

test("nothing counted without a public address, or with one that is not an address", () => {
  assert.equal(countsHere(SITE, "", true), false);
  assert.equal(countsHere(SITE, "kotonomi.example.app", true), false);
  assert.equal(countsHere("", SITE, true), false);
  assert.equal(countsHere("null", "null", true), false);
});
