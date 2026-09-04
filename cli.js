#!/usr/bin/env node

const { execFile } = require("node:child_process");

const API = (process.env.SNIP_API || "http://localhost:3000").replace(/\/+$/, "");

function usage() {
  console.log(`Usage:
  snip add <url>    Create a short link
  snip ls           List all links
  snip open <code>  Open a short link in your browser`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`Could not reach the backend at ${API}`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response (${response.status})`);
  }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function openBrowser(target) {
  const platform = process.platform;
  const command = platform === "win32" ? "start"
    : platform === "darwin" ? "open"
    : "xdg-open";
  const args = platform === "win32" ? ["", target] : [target];
  execFile(command, args, (error) => {
    if (error) console.error(`Could not open browser: ${error.message}`);
  });
}

async function main() {
  const [command, argument] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "add") {
    if (!argument || !/^https?:\/\/\S+$/i.test(argument)) {
      throw new Error("add requires a valid http or https URL");
    }
    const link = await request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: argument }),
    });
    console.log(link.shortUrl);
    return;
  }

  if (command === "ls") {
    const links = await request("/api/links");
    if (!links.length) {
      console.log("No links yet.");
      return;
    }
    const codeWidth = Math.max(4, ...links.map((link) => link.code.length));
    const hitsWidth = Math.max(4, ...links.map((link) => String(link.hits).length));
    console.log(`${"CODE".padEnd(codeWidth)}  ${"HITS".padStart(hitsWidth)}  URL`);
    for (const link of links) {
      console.log(`${link.code.padEnd(codeWidth)}  ${String(link.hits).padStart(hitsWidth)}  ${link.url}`);
    }
    return;
  }

  if (command === "open") {
    if (!argument) throw new Error("open requires a short code");
    const response = await fetch(`${API}/${encodeURIComponent(argument)}`, {
      redirect: "manual",
    }).catch(() => null);
    if (!response) throw new Error(`Could not reach the backend at ${API}`);
    if (response.status !== 302) {
      let body = {};
      try { body = await response.json(); } catch {}
      throw new Error(body.error || `Unknown short code: ${argument}`);
    }
    const target = response.headers.get("location");
    if (!target) throw new Error("Backend response did not include a redirect target");
    console.log(`Opening ${target}`);
    openBrowser(target);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => fail(error.message));
