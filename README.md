# my-installer

A Bun-based GitHub release binary installer to replace `~/bin/install.sh` and global aqua usage. It only installs binaries published as GitHub release assets.

## Design

- Editable config contains packages only.
- Runtime defaults are hardcoded in `installer.ts`:
  - install directory: `~/bin`
  - GitHub token command: `gh auth token`
  - GitHub API URL
  - concurrency limits
  - platform/architecture matching
  - ignored artifact types such as checksums, signatures, SBOMs, `.deb`, `.rpm`, etc.
- Installed state is stored on each binary as an extended attribute.
- Release checks and downloads run in parallel with `p-map`.
- Tests are offline and use captured GitHub release asset fixtures.

## Files

```text
installer.ts                 # installer implementation
installer.spec.ts            # offline artifact-selection tests
specs/current-packages.json  # package-only config generated from current tools
plan.html                    # implementation/review plan
```

## Install dependencies

```nu
bun install
```

Runtime state uses extended attributes, so Linux needs `getfattr` and `setfattr` available; macOS needs `xattr`.

## Config shape

Use a string when the binary name is the repo name and latest is OK:

```json
{
  "packages": [
    "sharkdp/fd"
  ]
}
```

Use an object only when you need a version, binary rename, binary path, or asset select hint:

```json
{
  "packages": [
    { "repo": "sharkdp/fd", "version": "v10.4.2" },
    { "repo": "BurntSushi/ripgrep", "name": "rg" },
    { "repo": "Ataraxy-Labs/weave", "name": "weave-driver", "select": "weave-driver" }
  ]
}
```

Supported object fields: `repo`, `version`, `name`, `path`, `select`.

## Usage

Resolve only:

```nu
bun installer.ts --config specs/current-packages.json --resolve-only
```

Dry run:

```nu
bun installer.ts --config specs/current-packages.json --dry-run
```

Install into the default location, `~/bin`:

```nu
bun installer.ts --config specs/current-packages.json
```

Update configured packages to their latest GitHub releases:

```nu
bun installer.ts update --config specs/current-packages.json
```

Updating prints the GitHub release link for each changed package.

Add a new GitHub package, write it to the config, and install it:

```nu
bun installer.ts add sharkdp/hyperfine --config specs/current-packages.json
```

If the binary name is not the repository name, provide it explicitly:

```nu
bun installer.ts add BurntSushi/ripgrep --binary rg --config specs/current-packages.json
```

Test with `/tmp/bin` instead of `~/bin`:

```nu
$env.MY_INSTALLER_BIN_DIR = "/tmp/bin"
bun installer.ts --config specs/current-packages.json
```

Target another platform for resolution tests:

```nu
bun installer.ts --config specs/current-packages.json --platform linux-x64 --resolve-only
bun installer.ts --config specs/current-packages.json --platform linux-arm64 --resolve-only
bun installer.ts --config specs/current-packages.json --platform darwin-x64 --resolve-only
bun installer.ts --config specs/current-packages.json --platform darwin-arm64 --resolve-only
```

`--resolve-only` reports unresolved packages as warnings and exits successfully so the whole spec can be reviewed.

Use best-effort mode when installing to continue if some packages have no matching GitHub asset:

```nu
bun installer.ts --config specs/current-packages.json --best-effort
```

## Up-to-date skipping

Installed state is stored directly on each installed binary as an extended attribute:

- Linux: `user.my-installer`
- macOS: `com.jpambrun.my-installer`

A binary is skipped when all of these match:

- release tag
- GitHub asset id
- GitHub asset name
- GitHub asset size
- executable exists at `~/bin/<binary>`
- metadata extended attribute exists and matches

Inspect state on Linux:

```nu
getfattr --only-values -n user.my-installer ~/bin/fd
```

Inspect state on macOS:

```nu
xattr -p com.jpambrun.my-installer ~/bin/fd
```

There is no separate state file or installer lock.

## Tests

```nu
bun test installer.spec.ts
```

The tests do not call GitHub. `installer.spec.ts` contains captured release asset metadata for the current package list and tests artifact selection for:

- `linux-x64`
- `linux-arm64`
- `darwin-x64`
- `darwin-arm64`

## GitHub-only scope

Packages without matching GitHub release binary assets are reported as unresolved. This intentionally excludes tools that publish binaries only through npm, vendor download pages, or other non-GitHub locations.
