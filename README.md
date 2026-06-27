# binup

A single-file Deno GitHub release binary installer to replace `~/bin/install.sh`
and global aqua usage. It only installs binaries published as GitHub release
assets.

## Design

- Editable config contains packages only.
- Runtime defaults are hardcoded in `binup.ts`:
  - install directory: `~/bin`
  - GitHub token command: `gh auth token`
  - GitHub API URL
  - concurrency limits
  - platform/architecture matching
  - ignored artifact types such as checksums, signatures, SBOMs, `.deb`, `.rpm`,
    etc.
- Installed state is stored on each binary as an extended attribute.
- Release checks and downloads run in parallel with a tiny built-in mapper.
- Tests are offline and use captured GitHub release asset fixtures.

## Files

```text
binup.ts                      # executable single-file implementation
binup.spec.ts                 # offline artifact-selection tests
deno.json                     # local dev tasks, not required to run binup.ts
~/.config/binup/packages.json # default editable config
```

## Requirements

No project dependencies are required; run the script directly with Deno.

Runtime state uses extended attributes, so Linux needs `getfattr` and `setfattr`
available; macOS needs `xattr`.

## Config shape

Use a string when the binary name is the repo name and latest is OK:

```json
{
  "packages": [
    "sharkdp/fd"
  ]
}
```

Use an object only when you need a version, binary rename, binary path, or asset
select hint. Version can be omitted (equivalent to `"latest"`) to always track
head:

```json
{
  "packages": [
    { "repo": "sharkdp/fd", "version": "v10.4.2" },
    { "repo": "BurntSushi/ripgrep", "name": "rg" },
    {
      "repo": "Ataraxy-Labs/weave",
      "name": "weave-driver",
      "select": "weave-driver"
    }
  ]
}
```

Supported object fields: `repo`, `version`, `name`, `path`, `select`. `version`
may be omitted or set to `"latest"` to track the newest release.

## Usage

Resolve only:

```nu
./binup.ts --resolve-only
```

Dry run:

```nu
./binup.ts --dry-run
```

Install into the default location, `~/bin`:

```nu
./binup.ts
```

Run without the executable bit if needed:

```nu
deno run --allow-env --allow-read --allow-write --allow-run --allow-net binup.ts update
```

Update configured packages to their latest GitHub releases:

```nu
./binup.ts update
```

Updating prints the GitHub release link for each changed package.

Add a new GitHub package, write it to the config, and install it:

```nu
./binup.ts add sharkdp/hyperfine
```

If the binary name is not the repository name, provide it explicitly:

```nu
./binup.ts add BurntSushi/ripgrep --binary rg
```

Test with `/tmp/bin` instead of `~/bin`:

```nu
$env.BINUP_BIN_DIR = "/tmp/bin"
./binup.ts --config specs/current-packages.json
```

Target another platform for resolution tests:

```nu
./binup.ts --config specs/current-packages.json --platform linux-x64 --resolve-only
./binup.ts --config specs/current-packages.json --platform linux-arm64 --resolve-only
./binup.ts --config specs/current-packages.json --platform darwin-x64 --resolve-only
./binup.ts --config specs/current-packages.json --platform darwin-arm64 --resolve-only
```

`--resolve-only` reports unresolved packages as warnings and exits successfully
so the whole spec can be reviewed.

Packages without a matching GitHub asset are skipped while resolved packages
continue installing.

## Up-to-date skipping

Installed state is stored directly on each installed binary as an extended
attribute:

- Linux: `user.binup`
- macOS: `com.jpambrun.binup`

A binary is skipped when all of these match:

- release tag
- GitHub asset id
- GitHub asset name
- GitHub asset size
- executable exists at `~/bin/<binary>`
- metadata extended attribute exists and matches

Inspect state on Linux:

```nu
getfattr --only-values -n user.binup ~/bin/fd
```

Inspect state on macOS:

```nu
xattr -p com.jpambrun.binup ~/bin/fd
```

There is no separate state file or installer lock.

## Tests

```nu
deno test --allow-env --allow-read --allow-write --allow-run binup.spec.ts
```

The tests do not call GitHub. `binup.spec.ts` contains captured release asset
metadata for the current package list and tests artifact selection for:

- `linux-x64`
- `linux-arm64`
- `darwin-x64`
- `darwin-arm64`

## GitHub-only scope

Packages without matching GitHub release binary assets are reported as
unresolved. This intentionally excludes tools that publish binaries only through
npm, vendor download pages, or other non-GitHub locations.
