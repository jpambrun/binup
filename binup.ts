#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-run --allow-net

import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  access,
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, join } from "node:path";

const HOME_DIR = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
const TMP_DIR = Deno.env.get("TMPDIR") ?? Deno.env.get("TEMP") ??
  Deno.env.get("TMP") ?? "/tmp";
const INSTALL_DIR = Deno.env.get("BINUP_BIN_DIR") ??
  Deno.env.get("MY_INSTALLER_BIN_DIR") ?? join(HOME_DIR, "bin");
const XATTR_NAME = Deno.build.os === "darwin"
  ? "com.jpambrun.binup"
  : "user.binup";
const CHECK_CONCURRENCY = 12;
const DOWNLOAD_CONCURRENCY = 4;
const GITHUB_API = "https://api.github.com";
const DEFAULT_CONFIG = join(HOME_DIR, ".config/binup/packages.json");
const EXCLUDED_ASSET_PARTS = [
  "sha256",
  "checksum",
  "checksums",
  ".sig",
  ".asc",
  "sbom",
  ".spdx",
  ".rpm",
  ".deb",
  ".apk",
  ".msi",
  ".exe",
];

async function pMap<T, U>(
  items: Iterable<T>,
  mapper: (item: T, index: number) => Promise<U> | U,
  options: { concurrency?: number } = {},
): Promise<U[]> {
  const input = Array.from(items);
  const results = new Array<U>(input.length);
  let next = 0;
  const concurrency = Math.max(
    1,
    Math.min(options.concurrency ?? input.length, input.length || 1),
  );
  await Promise.all(
    Array.from({ length: Math.min(concurrency, input.length) }, async () => {
      while (true) {
        const index = next++;
        if (index >= input.length) return;
        results[index] = await mapper(input[index], index);
      }
    }),
  );
  return results;
}

export type Os = "linux" | "darwin";
export type Arch = "x64" | "arm64";
export type Platform = { os: Os; arch: Arch };
export type BinarySpec = { name: string; path?: string };
export type PackageSpec = {
  repo: string;
  version?: string;
  binaries?: BinarySpec[];
  assetHints?: { select?: string };
};
export type PackageConfig = string | {
  repo: string;
  version?: string;
  name?: string;
  path?: string;
  select?: string;
  binaries?: BinarySpec[];
  assetHints?: { select?: string };
};
export type Config = { packages: PackageSpec[] };
export type ConfigFile = { packages: PackageConfig[] };
export type ReleaseAsset = {
  id: number;
  name: string;
  size: number;
  content_type?: string;
  browser_download_url: string;
};
export type Release = { tag_name: string; assets: ReleaseAsset[] };
export type SelectedAsset = {
  asset: ReleaseAsset;
  score: number;
  reasons: string[];
};
type Command = "install" | "update" | "add";
type Args = {
  command: Command;
  config: string;
  dryRun: boolean;
  resolveOnly: boolean;
  platform: Platform;
  bestEffort: boolean;
  binary?: string;
  repos: string[];
};
type InstalledRecord = {
  repo: string;
  binary: string;
  os: Os;
  arch: Arch;
  releaseTag: string;
  assetId: number;
  assetName: string;
  assetSize: number;
  installedPath: string;
  installedAt: string;
  sha256?: string;
};
type Plan = {
  pkg: PackageSpec;
  binary: BinarySpec;
  release: Release;
  selected: SelectedAsset;
  platform: Platform;
  installedPath: string;
  upToDate: boolean;
};
type BuildPlansResult = { plans: Plan[]; errors: string[] };

const OS_TOKENS: Record<Os, string[]> = {
  linux: ["linux", "unknown-linux", "linux-gnu", "linux-musl"],
  darwin: ["darwin", "apple-darwin", "macos", "mac-os", "osx", "mac"],
};
const OTHER_OS_TOKENS: Record<Os, string[]> = {
  linux: OS_TOKENS.darwin.concat([
    "android",
    "windows",
    "win32",
    "win64",
    "pc-windows",
    "freebsd",
    "openbsd",
    "netbsd",
  ]),
  darwin: OS_TOKENS.linux.concat([
    "android",
    "windows",
    "win32",
    "win64",
    "pc-windows",
    "freebsd",
    "openbsd",
    "netbsd",
  ]),
};
const ARCH_TOKENS: Record<Arch, string[]> = {
  x64: [
    "x86_64",
    "amd64",
    "x64",
    "x86-64",
    "linux-64",
    "darwin-64",
    "macos-64",
  ],
  arm64: ["aarch64", "arm64"],
};
const OTHER_ARCH_TOKENS: Record<Arch, string[]> = {
  x64: ARCH_TOKENS.arm64.concat(["armv7", "armv6", "armhf", "armel"]),
  arm64: ARCH_TOKENS.x64.concat(["armv7", "armv6", "armhf", "armel"]),
};

export function normalizePlatform(
  input = `${Deno.build.os}-${Deno.build.arch}`,
): Platform {
  const value = input.toLowerCase().replace("macos", "darwin");
  const match = value.match(/^(linux|darwin)[-_/](.+)$/);
  const rawOs = match?.[1];
  const rawArch = match?.[2];
  const os = rawOs === "darwin"
    ? "darwin"
    : rawOs === "linux"
    ? "linux"
    : undefined;
  const arch = rawArch === "x64" || rawArch === "amd64" || rawArch === "x86_64"
    ? "x64"
    : rawArch === "arm64" || rawArch === "aarch64"
    ? "arm64"
    : undefined;
  if (!os || !arch) throw new Error(`Unsupported platform: ${input}`);
  return { os, arch };
}

export function defaultBinaryName(repo: string): string {
  const overrides: Record<string, string> = {
    "BurntSushi/ripgrep": "rg",
    "Byron/dua-cli": "dua",
    "ClementTsang/bottom": "btm",
    "Wilfred/difftastic": "difft",
    "alexpasmantier/television": "tv",
    "ast-grep/ast-grep": "sg",
    "docker/docker-credential-helpers": "docker-credential-pass",
    "nats-io/natscli": "nats",
    "openai/codex": "codex",
    "sst/opencode": "opencode",
    "surrealdb/surrealdb": "surreal",
  };
  return overrides[repo] ?? repo.split("/").at(-1)!;
}

export function binariesOf(pkg: PackageSpec): BinarySpec[] {
  return pkg.binaries?.length
    ? pkg.binaries
    : [{ name: defaultBinaryName(pkg.repo) }];
}

export function selectHint(pkg: PackageSpec): string | undefined {
  return pkg.assetHints?.select;
}

export function candidateTags(pkg: PackageSpec): string[] {
  const version = pkg.version ?? "latest";
  if (version === "latest") return ["latest"];
  const tags = new Set<string>([version]);
  if (version.startsWith("v")) tags.add(version.slice(1));
  else if (version.includes("/")) tags.add(`@${version}`);
  else tags.add(`v${version}`);
  return [...tags];
}

export function selectAsset(
  pkg: PackageSpec,
  release: Release,
  platform: Platform,
  binaryName = binariesOf(pkg)[0]?.name,
): SelectedAsset | undefined {
  const hint = selectHint(pkg)?.replaceAll("'", "").toLowerCase();
  const hintApplies = hint
    ? !hasAny(hint, OTHER_OS_TOKENS[platform.os]) &&
      !hasAny(hint, OTHER_ARCH_TOKENS[platform.arch])
    : false;
  const hasPlatformSpecificAssets = release.assets.some((asset) => {
    const name = asset.name.toLowerCase();
    return !hasAny(name, EXCLUDED_ASSET_PARTS) &&
      hasAny(name, [
        ...OS_TOKENS.linux,
        ...OS_TOKENS.darwin,
        ...ARCH_TOKENS.x64,
        ...ARCH_TOKENS.arm64,
      ]);
  });
  const candidates = release.assets
    .map((asset) =>
      scoreAsset(
        asset,
        platform,
        hintApplies ? hint : undefined,
        binaryName,
        hasPlatformSpecificAssets,
      )
    )
    .filter((result): result is SelectedAsset => result !== undefined)
    .sort((a, b) =>
      b.score - a.score || a.asset.name.localeCompare(b.asset.name)
    );
  return candidates[0];
}

function scoreAsset(
  asset: ReleaseAsset,
  platform: Platform,
  hint?: string,
  binaryName?: string,
  hasPlatformSpecificAssets = true,
): SelectedAsset | undefined {
  const name = asset.name.toLowerCase();
  if (hasAny(name, EXCLUDED_ASSET_PARTS)) return undefined;
  if (hint && !name.includes(hint)) return undefined;
  if (hasAny(name, OTHER_OS_TOKENS[platform.os])) return undefined;
  if (
    hasAny(name, OTHER_ARCH_TOKENS[platform.arch]) &&
    !name.includes("universal")
  ) return undefined;

  let score = 0;
  let meaningful = false;
  const reasons: string[] = [];
  if (hint && name.includes(hint)) {
    score += 100;
    meaningful = true;
    reasons.push(`select:${hint}`);
  }
  if (binaryName) {
    const binary = binaryName.toLowerCase();
    if (name === binary || name.startsWith(`${binary}.`)) {
      score += 100;
      meaningful = true;
      reasons.push(`binary:${binary}`);
    } else if (name.startsWith(`${binary}-`) || name.startsWith(`${binary}_`)) {
      const rest = name.slice(binary.length + 1);
      const directPlatformSuffix =
        startsWithAny(rest, OS_TOKENS[platform.os]) ||
        startsWithAny(rest, ARCH_TOKENS[platform.arch]);
      score += directPlatformSuffix ? 90 : 30;
      meaningful = true;
      reasons.push(`binary:${binary}`);
    }
  }
  const osMatch = hasAny(name, OS_TOKENS[platform.os]);
  const archMatch = hasAny(name, ARCH_TOKENS[platform.arch]);
  const universal = name.includes("universal");
  if (
    platform.os === "darwin" && !osMatch && !universal && archMatch && !hint
  ) return undefined;
  if (
    hasPlatformSpecificAssets && !osMatch && !archMatch && !universal && !hint
  ) return undefined;
  if (osMatch) {
    score += 40;
    meaningful = true;
    reasons.push(platform.os);
  }
  if (archMatch) {
    score += 25;
    meaningful = true;
    reasons.push(platform.arch);
  }
  if (platform.os === "darwin" && universal) {
    score += 20;
    meaningful = true;
    reasons.push("universal");
  }
  if (name.includes("profile")) score -= 20;
  if (name.includes("baseline")) score -= 5;
  if (platform.os === "linux" && name.includes("musl")) score -= 4;
  if (platform.os === "linux" && name.includes("gnu")) score += 2;

  if (name.endsWith(".tar.gz")) score += 8;
  else if (name.endsWith(".tgz")) score += 7;
  else if (name.endsWith(".tar.xz")) score += 6;
  else if (name.endsWith(".zip")) score += 5;
  else if (!name.includes(".")) score += 3;

  return score > 0 && meaningful ? { asset, score, reasons } : undefined;
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function startsWithAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.startsWith(needle));
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: "install",
    config: DEFAULT_CONFIG,
    dryRun: false,
    resolveOnly: false,
    platform: normalizePlatform(),
    bestEffort: false,
    repos: [],
  };
  if (argv[0] === "install" || argv[0] === "update" || argv[0] === "add") {
    args.command = argv.shift() as Command;
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config") args.config = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--resolve-only") args.resolveOnly = true;
    else if (arg === "--best-effort") args.bestEffort = true;
    else if (arg === "--platform") args.platform = normalizePlatform(argv[++i]);
    else if (arg === "--binary") args.binary = argv[++i];
    else if (arg === "--help" || arg === "-h") printHelpAndExit();
    else if (arg.startsWith("--")) throw new Error(`Unknown argument: ${arg}`);
    else args.repos.push(arg);
  }
  return args;
}

function printHelpAndExit(): never {
  console.log(`Usage:
  ./binup.ts [install] [--config ~/.config/binup/packages.json] [--dry-run] [--resolve-only] [--platform linux-x64|linux-arm64|darwin-x64|darwin-arm64] [--best-effort]
  ./binup.ts update [repo...] [--config ~/.config/binup/packages.json]
  ./binup.ts add owner/repo [--binary name] [--config ~/.config/binup/packages.json]

Installs into ~/bin. For tests only, set BINUP_BIN_DIR=/tmp/bin.`);
  Deno.exit(0);
}

export function normalizeConfig(config: ConfigFile): Config {
  if (!Array.isArray(config.packages)) {
    throw new Error('Config must contain { "packages": [...] }');
  }
  return {
    packages: config.packages.map((entry) => {
      const raw = typeof entry === "string" ? { repo: entry } : entry;
      if (!raw.repo || !raw.repo.includes("/")) {
        throw new Error(`Invalid package repo: ${JSON.stringify(entry)}`);
      }
      const pkg: PackageSpec = { repo: raw.repo };
      if (raw.version) pkg.version = raw.version;
      if (raw.binaries?.length) pkg.binaries = raw.binaries;
      else if (raw.name || raw.path) {
        pkg.binaries = [{
          name: raw.name ?? defaultBinaryName(raw.repo),
          ...(raw.path ? { path: raw.path } : {}),
        }];
      }
      if (raw.select) pkg.assetHints = { select: raw.select };
      else if (raw.assetHints) pkg.assetHints = raw.assetHints;
      return pkg;
    }),
  };
}

async function loadConfig(path: string): Promise<Config> {
  return normalizeConfig(
    JSON.parse(await readFile(path, "utf8")) as ConfigFile,
  );
}

export function simplifyPackage(pkg: PackageSpec): PackageConfig {
  const binary = pkg.binaries?.[0];
  const entry: Exclude<PackageConfig, string> = { repo: pkg.repo };
  if (pkg.version && pkg.version !== "latest") entry.version = pkg.version;
  if (pkg.binaries && pkg.binaries.length > 1) entry.binaries = pkg.binaries;
  else if (binary && binary.name !== defaultBinaryName(pkg.repo)) {
    entry.name = binary.name;
  }
  if (binary?.path) entry.path = binary.path;
  if (pkg.assetHints?.select) entry.select = pkg.assetHints.select;
  return Object.keys(entry).length === 1 ? pkg.repo : entry;
}

async function writeConfig(path: string, config: Config): Promise<void> {
  await writeFile(
    path,
    `${
      JSON.stringify(
        { packages: config.packages.map(simplifyPackage) },
        null,
        2,
      )
    }\n`,
  );
}

function releaseUrl(repo: string, tag: string): string {
  return `https://github.com/${repo}/releases/tag/${encodeURIComponent(tag)}`;
}

async function ghToken(): Promise<string> {
  const token = (await runOutput(["gh", "auth", "token"])).trim();
  if (!token) throw new Error("gh auth token returned an empty token");
  return token;
}

async function githubGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "binup",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return (await response.json()) as T;
}

async function fetchRelease(
  pkg: PackageSpec,
  token: string,
  platform: Platform,
): Promise<Release> {
  const hint = selectHint(pkg)?.replaceAll("'", "").toLowerCase();
  if ((pkg.version ?? "latest") === "latest" && hint) {
    const releases = await githubGet<Release[]>(
      `${GITHUB_API}/repos/${pkg.repo}/releases?per_page=30`,
      token,
    );
    const release = releases.find((candidate) =>
      candidate.assets.some((asset) =>
        asset.name.toLowerCase().includes(hint) &&
        scoreAsset(asset, platform, hint)
      )
    );
    if (release) return release;
  }

  const errors: string[] = [];
  for (const tag of candidateTags(pkg)) {
    const url = tag === "latest"
      ? `${GITHUB_API}/repos/${pkg.repo}/releases/latest`
      : `${GITHUB_API}/repos/${pkg.repo}/releases/tags/${
        encodeURIComponent(tag)
      }`;
    try {
      return await githubGet<Release>(url, token);
    } catch (error) {
      errors.push(
        `${tag}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  throw new Error(`No release found for ${pkg.repo} (${errors.join("; ")})`);
}

async function commandExists(command: string): Promise<boolean> {
  return (await output(["sh", "-c", `command -v ${command} >/dev/null 2>&1`]))
    .code === 0;
}

async function ensureXattrTools(): Promise<void> {
  const commands = Deno.build.os === "darwin"
    ? ["xattr"]
    : ["getfattr", "setfattr"];
  const missing = [];
  for (const command of commands) {
    if (!(await commandExists(command))) missing.push(command);
  }
  if (missing.length > 0) {
    throw new Error(`Missing required xattr tool(s): ${missing.join(", ")}`);
  }
}

async function readInstalledRecord(
  path: string,
): Promise<InstalledRecord | undefined> {
  try {
    await access(path);
    const command = Deno.build.os === "darwin"
      ? ["xattr", "-p", XATTR_NAME, path]
      : ["getfattr", "--only-values", "-n", XATTR_NAME, path];
    const result = await output(command);
    if (result.code !== 0) return undefined;
    try {
      return JSON.parse(result.stdout) as InstalledRecord;
    } catch {
      return undefined;
    }
  } catch (error: any) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeInstalledRecord(
  path: string,
  record: InstalledRecord,
): Promise<void> {
  const value = JSON.stringify(record);
  const command = Deno.build.os === "darwin"
    ? ["xattr", "-w", XATTR_NAME, value, path]
    : ["setfattr", "-n", XATTR_NAME, "-v", value, path];
  await run(command);
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function isUpToDate(plan: Omit<Plan, "upToDate">): Promise<boolean> {
  const record = await readInstalledRecord(plan.installedPath);
  if (!record) return false;
  if (record.repo !== plan.pkg.repo) return false;
  if (record.binary !== plan.binary.name) return false;
  if (record.os !== plan.platform.os) return false;
  if (record.arch !== plan.platform.arch) return false;
  if (record.releaseTag !== plan.release.tag_name) return false;
  if (record.assetId !== plan.selected.asset.id) return false;
  if (record.assetName !== plan.selected.asset.name) return false;
  if (record.assetSize !== plan.selected.asset.size) return false;
  return isExecutable(plan.installedPath);
}

async function buildPlans(
  config: Config,
  token: string,
  platform: Platform,
): Promise<BuildPlansResult> {
  const packageResults = await pMap(
    config.packages,
    async (pkg): Promise<{ plans: Plan[]; errors: string[] }> => {
      try {
        const release = await fetchRelease(pkg, token, platform);
        const plans = await pMap(
          binariesOf(pkg),
          async (binary): Promise<Plan> => {
            const selected = selectAsset(pkg, release, platform, binary.name);
            if (!selected) {
              throw new Error(
                `No ${platform.os}-${platform.arch} asset found in ${release.tag_name}`,
              );
            }
            const installedPath = join(INSTALL_DIR, binary.name);
            const base = {
              pkg,
              binary,
              release,
              selected,
              platform,
              installedPath,
            };
            return { ...base, upToDate: await isUpToDate(base) };
          },
          { concurrency: 4 },
        );
        return { plans, errors: [] };
      } catch (error) {
        return {
          plans: [],
          errors: [
            `${pkg.repo}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
        };
      }
    },
    { concurrency: CHECK_CONCURRENCY },
  );
  return {
    plans: packageResults.flatMap((result) => result.plans),
    errors: packageResults.flatMap((result) => result.errors),
  };
}

async function downloadAndInstall(plan: Plan): Promise<InstalledRecord> {
  const workDir = await mkdtemp(join(TMP_DIR, "binup-"));
  try {
    const assetPath = join(workDir, plan.selected.asset.name);
    await download(plan.selected.asset.browser_download_url, assetPath);
    const sourcePath = await extractAndFindBinary(
      assetPath,
      workDir,
      plan.selected.asset.name,
      plan.binary,
      plan.platform,
    );
    await mkdir(INSTALL_DIR, { recursive: true });
    const tmpTarget = join(
      INSTALL_DIR,
      `.${plan.binary.name}.tmp-${Deno.pid}-${plan.selected.asset.id}-${randomUUID()}`,
    );
    await copyFile(sourcePath, tmpTarget);
    await chmod(tmpTarget, 0o755);
    await rename(tmpTarget, plan.installedPath);
    const record = {
      repo: plan.pkg.repo,
      binary: plan.binary.name,
      os: plan.platform.os,
      arch: plan.platform.arch,
      releaseTag: plan.release.tag_name,
      assetId: plan.selected.asset.id,
      assetName: plan.selected.asset.name,
      assetSize: plan.selected.asset.size,
      installedPath: plan.installedPath,
      installedAt: new Date().toISOString(),
      sha256: await sha256(plan.installedPath),
    } satisfies InstalledRecord;
    try {
      await writeInstalledRecord(plan.installedPath, record);
    } catch (error) {
      throw new Error(
        `Installed ${plan.installedPath} but failed to write ${XATTR_NAME} metadata: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return record;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function download(url: string, dest: string): Promise<void> {
  const response = await fetch(url, { headers: { "User-Agent": "binup" } });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }
  await Deno.writeFile(dest, response.body);
}

export async function extractAndFindBinary(
  assetPath: string,
  workDir: string,
  assetName: string,
  binary: BinarySpec,
  platform: Platform,
): Promise<string> {
  const lower = assetName.toLowerCase();
  const extractDir = join(workDir, "extract");
  await mkdir(extractDir, { recursive: true });
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) {
    await assertSafeArchiveEntries(
      await runOutput(["tar", "-tzf", assetPath]),
      assetName,
    );
    await run(["tar", "-xzf", assetPath, "-C", extractDir]);
  } else if (lower.endsWith(".tar.xz")) {
    await assertSafeArchiveEntries(
      await runOutput(["tar", "-tJf", assetPath]),
      assetName,
    );
    await run(["tar", "-xJf", assetPath, "-C", extractDir]);
  } else if (lower.endsWith(".zip")) {
    await assertSafeArchiveEntries(
      await runOutput(["unzip", "-Z1", assetPath]),
      assetName,
    );
    await run(["unzip", "-q", assetPath, "-d", extractDir]);
  } else {
    const raw = join(extractDir, basename(assetName));
    await copyFile(assetPath, raw);
    return raw;
  }

  if (binary.path) {
    const explicitPath = join(extractDir, binary.path);
    await rejectSymlink(explicitPath, assetName);
    await access(explicitPath);
    return explicitPath;
  }
  const walked = await walk(extractDir, binary.name);
  const files = walked.files;
  const matches = files.filter((path) => basename(path) === binary.name);
  if (matches.length === 1) return matches[0];
  const executableMatches = [];
  for (const match of matches) {
    if (await isExecutable(match)) executableMatches.push(match);
  }
  if (executableMatches.length === 1) return executableMatches[0];
  const platformMatch = choosePlatformMatch(
    executableMatches.length ? executableMatches : matches,
    platform,
  );
  if (platformMatch) return platformMatch;
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous binary ${binary.name} in ${assetName}: ${matches.join(", ")}`,
    );
  }
  if (walked.binarySymlinks.length > 0) {
    throw new Error(
      `Unsupported symlink in archive: ${walked.binarySymlinks[0]}`,
    );
  }

  const executableFiles = [];
  for (const file of files) {
    if (await isExecutable(file)) executableFiles.push(file);
  }
  if (executableFiles.length === 1) return executableFiles[0];
  const platformExecutable = choosePlatformMatch(executableFiles, platform);
  if (platformExecutable) return platformExecutable;
  throw new Error(`Could not find binary ${binary.name} in ${assetName}`);
}

export function choosePlatformMatch(
  paths: string[],
  platform: Platform,
): string | undefined {
  const scored = paths
    .map((path) => {
      const value = path.toLowerCase();
      if (hasAny(value, OTHER_OS_TOKENS[platform.os])) return undefined;
      if (
        hasAny(value, OTHER_ARCH_TOKENS[platform.arch]) &&
        !value.includes("universal")
      ) return undefined;
      let score = 0;
      if (hasAny(value, OS_TOKENS[platform.os])) score += 40;
      if (hasAny(value, ARCH_TOKENS[platform.arch])) score += 25;
      if (platform.os === "linux" && value.includes("musl")) score += 3;
      if (platform.os === "linux" && value.includes("gnu")) score += 2;
      if (platform.os === "darwin" && value.includes("apple-darwin")) {
        score += 3;
      }
      if (value.includes("universal")) score += 1;
      return score > 0 ? { path, score } : undefined;
    })
    .filter((item): item is { path: string; score: number } =>
      item !== undefined
    )
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  if (scored.length === 0) return undefined;
  if (scored.length === 1 || scored[0].score > scored[1].score) {
    return scored[0].path;
  }
}

async function walk(
  dir: string,
  binaryName?: string,
): Promise<{ files: string[]; binarySymlinks: string[] }> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        return {
          files: [],
          binarySymlinks: entry.name === binaryName ? [path] : [],
        };
      }
      if (entry.isDirectory()) return walk(path, binaryName);
      return { files: [path], binarySymlinks: [] };
    }),
  );
  return {
    files: results.flatMap((result) => result.files),
    binarySymlinks: results.flatMap((result) => result.binarySymlinks),
  };
}

async function rejectSymlink(path: string, assetName: string): Promise<void> {
  if ((await lstat(path)).isSymbolicLink()) {
    throw new Error(`Unsupported symlink in ${assetName}: ${path}`);
  }
}

export function isSafeArchivePath(path: string): boolean {
  if (!path || path.startsWith("/") || path.startsWith("\\\\")) return false;
  if (/^[A-Za-z]:/.test(path)) return false;
  return !path.split(/[\\/]+/).some((part) => part === "..");
}

async function assertSafeArchiveEntries(
  output: string,
  assetName: string,
): Promise<void> {
  const unsafe = output.split(/\r?\n/).filter(Boolean).filter((entry) =>
    !isSafeArchivePath(entry)
  );
  if (unsafe.length > 0) {
    throw new Error(
      `Unsafe paths in ${assetName}: ${unsafe.slice(0, 5).join(", ")}`,
    );
  }
}

async function output(
  command: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await proc.output();
  const decoder = new TextDecoder();
  return {
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
}

async function runOutput(command: string[]): Promise<string> {
  const result = await output(command);
  if (result.code !== 0) {
    throw new Error(`${command.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

async function run(command: string[]): Promise<void> {
  await runOutput(command);
}

async function sha256(path: string): Promise<string> {
  const hash = createHash("sha256");
  hash.update(await readFile(path));
  return hash.digest("hex");
}

async function fetchLatestRelease(
  repo: string,
  token: string,
): Promise<Release> {
  return githubGet<Release>(
    `${GITHUB_API}/repos/${repo}/releases/latest`,
    token,
  );
}

async function fetchLatestPackageRelease(
  pkg: PackageSpec,
  token: string,
  platform: Platform,
): Promise<Release> {
  if (selectHint(pkg)) {
    const releases = await githubGet<Release[]>(
      `${GITHUB_API}/repos/${pkg.repo}/releases?per_page=30`,
      token,
    );
    const release = releases.find((candidate) =>
      binariesOf(pkg).some((binary) =>
        selectAsset(pkg, candidate, platform, binary.name)
      )
    );
    if (release) return release;
  }
  return fetchLatestRelease(pkg.repo, token);
}

async function updateConfigVersions(
  configPath: string,
  config: Config,
  token: string,
  platform: Platform,
  repos: string[],
): Promise<void> {
  const selectedRepos = repos.length ? new Set(repos) : undefined;
  const targets = config.packages.filter((pkg) =>
    !selectedRepos || selectedRepos.has(pkg.repo)
  );
  const results = await pMap(
    targets,
    async (pkg) => {
      try {
        const latest = await fetchLatestPackageRelease(pkg, token, platform);
        const isTrackingLatest = !pkg.version || pkg.version === "latest";
        if (isTrackingLatest) {
          return { pkg, latest, trackingLatest: true, changed: false };
        }

        const currentTags = new Set(candidateTags(pkg));
        if (currentTags.has(latest.tag_name)) {
          return { pkg, latest, trackingLatest: false, changed: false };
        }
        const oldVersion = pkg.version ?? "latest";
        pkg.version = latest.tag_name;
        return {
          pkg,
          latest,
          trackingLatest: false,
          oldVersion,
          changed: true,
        };
      } catch (error) {
        return {
          pkg,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    { concurrency: CHECK_CONCURRENCY },
  );

  let changed = false;
  const errors = [];
  for (const result of results) {
    if ("error" in result) {
      errors.push(`${result.pkg.repo}: ${result.error}`);
      continue;
    }
    if (result.changed) {
      changed = true;
      console.log(
        `updated       ${result.pkg.repo} ${result.oldVersion} -> ${result.latest.tag_name}`,
      );
      console.log(
        `release       ${releaseUrl(result.pkg.repo, result.latest.tag_name)}`,
      );
    }
  }
  if (selectedRepos) {
    for (const repo of selectedRepos) {
      if (!config.packages.some((pkg) => pkg.repo === repo)) {
        console.warn(`WARN ${repo} is not in ${configPath}`);
      }
    }
  }
  if (changed) await writeConfig(configPath, config);
  if (errors.length > 0) {
    throw new Error(
      `Failed to update ${errors.length} package(s):\n${errors.join("\n")}`,
    );
  }
}

async function addPackage(
  configPath: string,
  config: Config,
  token: string,
  args: Args,
): Promise<Config> {
  const repo = args.repos[0];
  if (!repo || !repo.includes("/")) {
    throw new Error("add requires a GitHub repo like owner/name");
  }
  if (config.packages.some((pkg) => pkg.repo === repo)) {
    throw new Error(`${repo} is already in ${configPath}`);
  }
  const binaryName = args.binary ?? defaultBinaryName(repo);
  const pkg: PackageSpec = {
    repo,
    version: "latest",
    binaries: [{ name: binaryName }],
  };
  const latest = await fetchLatestRelease(repo, token);
  const selected = selectAsset(pkg, latest, args.platform, binaryName);
  if (!selected) {
    throw new Error(
      `No ${args.platform.os}-${args.platform.arch} asset found for ${repo} in ${latest.tag_name}`,
    );
  }
  pkg.version = latest.tag_name;
  config.packages.push(pkg);
  config.packages.sort((a, b) =>
    `${a.repo}:${binariesOf(a)[0]?.name ?? ""}`.localeCompare(
      `${b.repo}:${binariesOf(b)[0]?.name ?? ""}`,
    )
  );
  await writeConfig(configPath, config);
  console.log(
    `added         ${repo} -> ${binaryName} (${latest.tag_name}, ${selected.asset.name})`,
  );
  console.log(`release       ${releaseUrl(repo, latest.tag_name)}`);
  return { packages: [pkg] };
}

async function installConfig(
  config: Config,
  args: Args,
  token: string,
): Promise<void> {
  await ensureXattrTools();
  const { plans, errors } = await buildPlans(config, token, args.platform);
  const current = plans.filter((plan) => plan.upToDate);
  const pending = plans.filter((plan) => !plan.upToDate);
  for (const plan of plans) {
    const status = plan.upToDate
      ? "current"
      : args.resolveOnly || args.dryRun
      ? "would install"
      : "install";
    console.log(
      `${
        status.padEnd(13)
      } ${plan.pkg.repo} -> ${plan.binary.name} (${plan.release.tag_name}, ${plan.selected.asset.name})`,
    );
  }
  for (const error of errors) console.warn(`WARN ${error}`);
  console.log(
    `Summary: ${current.length} current, ${pending.length} pending, ${errors.length} unresolved, install dir ${INSTALL_DIR}`,
  );
  if (
    (args.resolveOnly || args.dryRun) && errors.length > 0 && !args.bestEffort
  ) {
    console.warn(
      "WARN unresolved packages were skipped; use --best-effort to silence this warning",
    );
  }
  if (args.resolveOnly || args.dryRun || pending.length === 0) return;
  if (errors.length > 0 && !args.bestEffort) {
    throw new Error(
      `Refusing to install with ${errors.length} unresolved package(s). Re-run with --best-effort to install the resolved packages only.`,
    );
  }

  const results = await pMap(
    pending,
    async (plan) => {
      try {
        await downloadAndInstall(plan);
        console.log(`installed     ${plan.pkg.repo} -> ${plan.binary.name}`);
        return undefined;
      } catch (error) {
        return `${plan.pkg.repo} -> ${plan.binary.name}: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    },
    { concurrency: DOWNLOAD_CONCURRENCY },
  );
  const installErrors = results.filter((result): result is string =>
    result !== undefined
  );
  if (installErrors.length > 0) {
    throw new Error(
      `Failed to install ${installErrors.length} package(s):\n${
        installErrors.join("\n")
      }`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs([...Deno.args]);
  const config = await loadConfig(args.config);
  const token = await ghToken();
  if (args.command === "update") {
    await updateConfigVersions(
      args.config,
      config,
      token,
      args.platform,
      args.repos,
    );
    return;
  }
  if (args.command === "add") {
    const addedConfig = await addPackage(args.config, config, token, args);
    await installConfig(addedConfig, args, token);
    return;
  }
  await installConfig(config, args, token);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    Deno.exit(1);
  });
}
