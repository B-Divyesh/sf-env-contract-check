type Profile = "node" | "docker" | "python";
type Level = "error" | "warning";

interface Finding {
  level: Level;
  key?: string;
  message: string;
}

const example = `APP_PORT="3000"
DEBUG="false"
DATABASE_URL="https://db.internal/app"
LOG_LEVEL=info`;

const required = ["APP_PORT", "DEBUG", "DATABASE_URL"];
const known = new Set([...required, "LOG_LEVEL"]);
const form = document.querySelector<HTMLFormElement>("#demo-form");
const input = document.querySelector<HTMLTextAreaElement>("#env-input");
const profileSelect = document.querySelector<HTMLSelectElement>("#profile");
const panel = document.querySelector<HTMLDivElement>("#result-panel");
const reset = document.querySelector<HTMLButtonElement>("#reset-demo");
const copy = document.querySelector<HTMLButtonElement>("#copy-command");
const copyStatus = document.querySelector<HTMLSpanElement>("#copy-status");
const offlineNote = document.querySelector<HTMLElement>("#offline-note");

function parse(source: string, profile: Profile): { values: Map<string, string>; findings: Finding[] } {
  const values = new Map<string, string>();
  const findings: Finding[] = [];

  source.split(/\r?\n/).forEach((original, index) => {
    const trimmed = original.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    let line = original;
    if (profile === "python" && /^export\s+/.test(trimmed)) line = trimmed.replace(/^export\s+/, "");
    const split = line.indexOf("=");
    if (split < 1) {
      findings.push({ level: "error", message: `Line ${index + 1} needs KEY=VALUE.` });
      return;
    }
    const key = line.slice(0, split).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      findings.push({ level: "error", message: `Line ${index + 1} has an invalid key.` });
      return;
    }
    let value = line.slice(split + 1);
    const quoted = (value.trim().startsWith('"') && value.trim().endsWith('"')) ||
      (value.trim().startsWith("'") && value.trim().endsWith("'"));
    if (profile === "docker") {
      if (quoted) findings.push({ level: "warning", key, message: "Docker keeps the surrounding quotes." });
    } else {
      value = value.trim();
      if (quoted) value = value.slice(1, -1);
      else value = value.split("#", 1)[0].trimEnd();
      if (profile === "python" && value.includes("${")) {
        findings.push({ level: "warning", key, message: "Python may interpolate this at runtime." });
      }
    }
    if (values.has(key)) findings.push({ level: "warning", key, message: "Duplicate key replaces its earlier declaration." });
    values.set(key, value);
  });
  return { values, findings };
}

function inspect(source: string, profile: Profile): Finding[] {
  if (!source.trim()) return [{ level: "error", message: "The environment file is empty. Paste KEY=VALUE lines to continue." }];
  const { values, findings } = parse(source, profile);
  required.forEach((key) => {
    if (!values.has(key)) findings.push({ level: "error", key, message: "Required key is absent." });
    else if (values.get(key) === "") findings.push({ level: "error", key, message: "Required key is present but empty." });
  });
  for (const key of values.keys()) {
    if (!known.has(key)) findings.push({ level: "warning", key, message: "Key is not declared in the contract." });
  }
  const port = values.get("APP_PORT");
  if (port && !/^\d+$/.test(port)) findings.push({ level: "error", key: "APP_PORT", message: "Expected a base-10 integer." });
  if (port && /^\d+$/.test(port) && (Number(port) < 1 || Number(port) > 65535)) {
    findings.push({ level: "error", key: "APP_PORT", message: "Integer must be between 1 and 65535." });
  }
  const debug = values.get("DEBUG");
  if (debug && debug !== "true" && debug !== "false") findings.push({ level: "error", key: "DEBUG", message: "Expected true or false." });
  const url = values.get("DATABASE_URL");
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("scheme");
    } catch {
      findings.push({ level: "error", key: "DATABASE_URL", message: "Expected an absolute http or https URL; value remains redacted." });
    }
  }
  return findings;
}

function setPanel(state: "empty" | "loading" | "pass" | "fail", findings: Finding[] = []): void {
  if (!panel) return;
  panel.className = `result-panel is-${state}`;
  panel.replaceChildren();
  const status = document.createElement("div");
  status.className = "result-status";
  const mark = document.createElement("span");
  mark.className = "status-mark";
  mark.setAttribute("aria-hidden", "true");
  const strong = document.createElement("strong");

  if (state === "loading") {
    mark.textContent = "◌";
    strong.textContent = "Checking parser semantics…";
  } else if (state === "pass") {
    mark.textContent = "✓";
    strong.textContent = "Contract holds";
  } else if (state === "fail") {
    mark.textContent = "×";
    const errors = findings.filter((item) => item.level === "error").length;
    const warnings = findings.length - errors;
    strong.textContent = `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}`;
  } else {
    mark.textContent = "○";
    strong.textContent = "Ready to inspect";
  }
  status.append(mark, strong);
  panel.append(status);

  if (state === "pass") {
    const note = document.createElement("p");
    note.textContent = "All required keys match their types under this parser profile. No values were printed.";
    panel.append(note);
  } else if (state === "fail") {
    const list = document.createElement("ul");
    list.className = "diagnostic-list";
    findings.forEach((finding) => {
      const item = document.createElement("li");
      if (finding.level === "warning") item.className = "warning";
      if (finding.key) {
        const key = document.createElement("code");
        key.textContent = `${finding.key} — `;
        item.append(key);
      }
      item.append(finding.message);
      list.append(item);
    });
    panel.append(list);
  }
  if (state !== "loading" && state !== "empty") {
    panel.classList.add("has-updated");
    panel.focus({ preventScroll: true });
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!input || !profileSelect) return;
  setPanel("loading");
  window.setTimeout(() => {
    const findings = inspect(input.value, profileSelect.value as Profile);
    setPanel(findings.length ? "fail" : "pass", findings);
  }, 90);
});

reset?.addEventListener("click", () => {
  if (!input || !profileSelect) return;
  input.value = example;
  profileSelect.value = "node";
  setPanel("empty");
  input.focus();
});

copy?.addEventListener("click", async () => {
  const command = document.querySelector("#install-command")?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(command);
    copy.textContent = "Copied";
    if (copyStatus) copyStatus.textContent = "Install command copied to clipboard.";
  } catch {
    copy.textContent = "Select command above";
    if (copyStatus) copyStatus.textContent = "Clipboard access was unavailable. Select the command above to copy it.";
  }
  window.setTimeout(() => { if (copy) copy.textContent = "Copy command"; }, 1800);
});

function updateOffline(): void {
  if (offlineNote) offlineNote.hidden = navigator.onLine;
}

window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);
updateOffline();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => undefined));
}
