import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere, platformOf } from "../src/lib/usage.ts";

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

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  ipod: "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromebook: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  linux: "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
};

test("an iPhone, iPad or iPod is ios, and so is an iPad that says it is a Mac", () => {
  assert.equal(platformOf(UA.iphone, 5), "ios");
  assert.equal(platformOf(UA.ipad, 5), "ios");
  assert.equal(platformOf(UA.ipod, 5), "ios");
  assert.equal(platformOf(UA.mac, 5), "ios");
});

test("Android is android, though it also says Linux", () => {
  assert.equal(platformOf(UA.android, 5), "android");
  assert.equal(platformOf(UA.android, 0), "android");
});

test("a Mac, Windows, a Chromebook or Linux is pc, with a touch screen or without", () => {
  assert.equal(platformOf(UA.mac, 0), "pc");
  assert.equal(platformOf(UA.mac, 1), "pc");
  assert.equal(platformOf(UA.windows, 0), "pc");
  assert.equal(platformOf(UA.windows, 10), "pc");
  assert.equal(platformOf(UA.chromebook, 0), "pc");
  assert.equal(platformOf(UA.linux, 0), "pc");
});

test("anything else, or nothing said, is other", () => {
  assert.equal(platformOf("Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko)", 0), "other");
  assert.equal(platformOf("curl/8.4.0", 0), "other");
  assert.equal(platformOf("", 5), "other");
  assert.equal(platformOf(undefined, 5), "other");
  assert.equal(platformOf(null, 0), "other");
  assert.equal(platformOf(42, 0), "other");
  assert.equal(platformOf(UA.mac, Number.NaN), "pc");
  assert.equal(platformOf(UA.mac, undefined), "pc");
});
