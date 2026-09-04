import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const bundle = resolve(root, "bundle");
const push = process.argv.includes("--push");
const git = process.platform === "win32" ? "git.exe" : "git";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command, args, cwd = root) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && (command === npm || command === npx),
  });
}

function hasStagedChanges(cwd) {
  try {
    execFileSync(git, ["diff", "--cached", "--quiet"], { cwd, stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
}

run(git, ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);
run(npm, ["install"], resolve(root, "frontend"));
run(npx, ["ng", "build"], resolve(root, "frontend"));

const builtUi = resolve(root, "frontend", "dist", "snip-frontend", "browser");
if (!existsSync(resolve(builtUi, "index.html"))) {
  throw new Error(`Frontend build output is missing: ${resolve(builtUi, "index.html")}`);
}

rmSync(resolve(bundle, "public"), { recursive: true, force: true });
mkdirSync(bundle, { recursive: true });
cpSync(builtUi, resolve(bundle, "public"), { recursive: true });
cpSync(resolve(root, "backend", "server.js"), resolve(bundle, "server.js"));
cpSync(resolve(root, "cli", "cli.js"), resolve(bundle, "cli.js"));
writeFileSync(resolve(bundle, ".env"), "PUBLIC_DIR=./public\n");
writeFileSync(resolve(bundle, "package.json"), `${JSON.stringify({
  name: "snip-bundle",
  private: true,
  scripts: { start: "bun server.js" },
}, null, 2)}\n`);
writeFileSync(resolve(bundle, "Dockerfile"), `FROM oven/bun:1-alpine
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD bun server.js
`);
writeFileSync(resolve(bundle, ".dockerignore"), `.git
.gitignore
node_modules
`);
writeFileSync(resolve(bundle, "railway.json"), `${JSON.stringify({
  build: { builder: "DOCKERFILE" },
}, null, 2)}\n`);

run(git, ["add", "-A"], bundle);
if (hasStagedChanges(bundle)) {
  run(git, ["commit", "-m", "Generate release bundle"], bundle);
  console.log("bundle: committed generated output");
} else {
  console.log("bundle: unchanged");
}

run(git, ["add", "bundle"]);
if (hasStagedChanges(root)) {
  run(git, ["commit", "-m", "Bump bundle submodule"]);
  console.log("main: committed bundle pointer");
} else {
  console.log("main: unchanged");
}

if (push) {
  run(git, ["push", "origin", "HEAD:bundle"], bundle);
  run(git, ["push", "origin", "main"]);
  console.log("pushed bundle and main");
}
