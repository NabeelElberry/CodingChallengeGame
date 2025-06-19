// make-admin.js (ESM version)
import admin from "firebase-admin";
import { readFile } from "fs/promises";

// Replace this with the path to your JSON key
const serviceAccount = JSON.parse(
  await readFile(new URL("./service-account.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "UID_HERE";

admin.auth().setCustomUserClaims(uid, { role: "admin" })
  .then(() => console.log(`Role set to admin for ${uid}`))
  .catch(console.error);