// Izrađuje "client secret" za Sign in with Apple (JWT, ES256) iz .p8 ključa. Vrijedi najviše 6 mjeseci
// (Apple ograničenje), pa ga treba obnoviti prije isteka i ponovno zalijepiti u Supabase.
//
// Upotreba (ključ ostaje na tvom računalu, ništa se ne šalje nikamo):
//   node scripts/apple-client-secret.mjs <TEAM_ID> <KEY_ID> <SERVICES_ID> <putanja/do/AuthKey_XXXX.p8>
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const [teamId, keyId, servicesId, keyPath] = process.argv.slice(2);
if (!teamId || !keyId || !servicesId || !keyPath) {
  console.error("Upotreba: node scripts/apple-client-secret.mjs <TEAM_ID> <KEY_ID> <SERVICES_ID> <putanja .p8>");
  process.exit(1);
}

const b64u = (b) => Buffer.from(b).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = { iss: teamId, iat: now, exp: now + 60 * 60 * 24 * 180, aud: "https://appleid.apple.com", sub: servicesId };
const input = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
const key = createPrivateKey(readFileSync(keyPath, "utf8"));
const signature = sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" });

console.log(`${input}.${b64u(signature)}`);
console.error(`\nIsteče: ${new Date((now + 60 * 60 * 24 * 180) * 1000).toISOString().slice(0, 10)} (obnovi prije toga)`);
