// Checks word files while they are written: node scripts/check-words.mjs src/content/words/toeic-1.ts [...]
// Prints each file's count and every word that breaks a rule of src/content/check.ts, or is in two lists.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { problemsOf } from "../src/content/check.ts";

let bad = 0;
const seen = new Map();
for (const file of process.argv.slice(2)) {
  const mod = await import(pathToFileURL(resolve(file)).href);
  for (const [name, list] of Object.entries(mod)) {
    if (!Array.isArray(list)) continue;
    console.log(`${file} ${name}: ${list.length} words`);
    for (const w of list) {
      const problems = problemsOf(w);
      if (seen.has(w.en)) problems.push(`also in ${seen.get(w.en)}`);
      seen.set(w.en, name);
      if (problems.length) {
        bad++;
        console.log(`  ${w.en}: ${problems.join("; ")}`);
      }
    }
  }
}
console.log(bad ? `${bad} to fix` : "all good");
process.exitCode = bad ? 1 : 0;
