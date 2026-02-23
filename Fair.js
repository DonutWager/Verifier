const crypto = require("crypto");

// PASTE FROM DISCORD (VERIFY-LOGS)
const fairHead = "PASTE_FAIR_HEAD_HEX";       // commitment head shi
const serverSeed = "PASTE_SERVER_SEED_HEX";   // server seed
const clientSeed = "PASTE_CLIENT_SEED";       // player username, 
const nonce = 1;                              // bet number, PASTE NONCE HERE
const winIfGreaterThan = 50;
const seedChainMaxSteps = 5000;
const expectedRoll = null;                    // optional

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

function hmacSha256Hex(key, msg) {
  return crypto.createHmac("sha256", key).update(msg).digest("hex");
}

function rollFromHashV2_fixed10(hash) {
  const slice1 = hash.slice(0, 13);
  const slice2 = hash.slice(13, 26);
  const slice3 = hash.slice(26, 39);

  const int1 = parseInt(slice1, 16);
  const int2 = parseInt(slice2, 16);
  const int3 = parseInt(slice3, 16);

  const norm1 = (int1 / 2 ** 52) * 100;
  const norm2 = (int2 / 2 ** 52) * 10;
  const norm3 = (int3 / 2 ** 52) * 50;

  let res = Math.max(0, norm1 - norm2);

  if (res === 0) return norm3;
  if (res > 50) return norm3 + 50;
  return res;
}

function verifyRoll(serverSeed, clientSeed, nonce) {
  const msg = `${clientSeed}:${nonce}`;
  const hex = hmacSha256Hex(serverSeed, msg);
  const roll = rollFromHashV2_fixed10(hex);
  const win = roll > winIfGreaterThan;
  return { roll, win, hmac: hex };
}

function verifyFairHead(serverSeed, fairHead, maxSteps = 5000) {
  let cur = serverSeed;
  for (let i = 1; i <= maxSteps; i++) {
    cur = sha256Hex(cur);
    if (cur === fairHead) {
      return { ok: true, steps: i };
    }
  }
  return { ok: false, steps: null };
}

const headCheck = verifyFairHead(serverSeed, fairHead, seedChainMaxSteps);
const out = verifyRoll(serverSeed, clientSeed, nonce);

console.log("clientSeed =", clientSeed);
console.log("nonce      =", nonce);
console.log("serverSeed =", serverSeed);
console.log("fairHead   =", fairHead);

console.log("\n[Commitment check]");
console.log(
  "serverSeed -> fairHead =",
  headCheck.ok ? `✅ PASS (${headCheck.steps} sha256 steps)` : "❌ FAIL (not linked to fairHead)"
);

console.log("\n[Roll check]");
console.log("hmac =", out.hmac);
console.log("roll =", out.roll.toFixed(2));
console.log("result =", out.win ? `WIN (roll > ${winIfGreaterThan})` : `LOSE (roll <= ${winIfGreaterThan})`);

if (typeof expectedRoll === "number") {
  const ok = Math.abs(out.roll - expectedRoll) < 0.005;
  console.log("\nexpected =", expectedRoll.toFixed(2));
  console.log("match    =", ok ? "✅ PASS" : "❌ FAIL");
}
