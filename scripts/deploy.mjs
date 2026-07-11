import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout.trim();
}

async function main() {
  const status = capture("git", ["status", "--porcelain"]);
  if (!status) {
    console.log("No changes to deploy.");
    return;
  }

  const rl = createInterface({ input, output });
  const message = (await rl.question("Commit message: ")).trim();
  rl.close();

  if (!message) {
    console.error("A commit message is required.");
    process.exit(1);
  }

  run("npm", ["run", "build"]);
  run("git", ["add", "-A"]);
  run("git", ["commit", "-m", message]);
  run("git", ["push", "origin", "main"]);
}

void main();
