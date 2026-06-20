import { describe, expect, test } from "bun:test";
import { binariesOf, candidateTags, choosePlatformMatch, isSafeArchivePath, normalizeConfig, normalizePlatform, selectAsset, type ConfigFile, type PackageSpec, type Release } from "./installer";

type Fixture = { pkg: PackageSpec; release: Release; expected: Record<string, Record<string, string | null>> };

const PLATFORMS = ["linux-x64", "linux-arm64", "darwin-x64", "darwin-arm64"] as const;
const FIXTURES = [
  {
    "pkg": {
      "repo": "abiosoft/colima",
      "version": "v0.10.3"
    },
    "release": {
      "tag_name": "v0.10.3",
      "assets": [
        {
          "id": 438456725,
          "name": "colima-Darwin-arm64",
          "size": 15656320,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Darwin-arm64"
        },
        {
          "id": 438456723,
          "name": "colima-Darwin-arm64.sha256sum",
          "size": 86,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Darwin-arm64.sha256sum"
        },
        {
          "id": 438456722,
          "name": "colima-Darwin-x86_64",
          "size": 16954240,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Darwin-x86_64"
        },
        {
          "id": 438456724,
          "name": "colima-Darwin-x86_64.sha256sum",
          "size": 87,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Darwin-x86_64.sha256sum"
        },
        {
          "id": 438456730,
          "name": "colima-Linux-aarch64",
          "size": 15068215,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Linux-aarch64"
        },
        {
          "id": 438456740,
          "name": "colima-Linux-aarch64.sha256sum",
          "size": 87,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Linux-aarch64.sha256sum"
        },
        {
          "id": 438456720,
          "name": "colima-Linux-x86_64",
          "size": 16160826,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Linux-x86_64"
        },
        {
          "id": 438456729,
          "name": "colima-Linux-x86_64.sha256sum",
          "size": 86,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/abiosoft/colima/releases/download/v0.10.3/colima-Linux-x86_64.sha256sum"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "colima": "colima-Linux-x86_64"
      },
      "linux-arm64": {
        "colima": "colima-Linux-aarch64"
      },
      "darwin-x64": {
        "colima": "colima-Darwin-x86_64"
      },
      "darwin-arm64": {
        "colima": "colima-Darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "alexpasmantier/television",
      "version": "0.15.9"
    },
    "release": {
      "tag_name": "0.15.9",
      "assets": [
        {
          "id": 447568864,
          "name": "tv-0.15.9-aarch64-apple-darwin.sha256",
          "size": 104,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-apple-darwin.sha256"
        },
        {
          "id": 447568866,
          "name": "tv-0.15.9-aarch64-apple-darwin.tar.gz",
          "size": 3559814,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 447570365,
          "name": "tv-0.15.9-aarch64-unknown-linux-gnu.deb",
          "size": 2435684,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-unknown-linux-gnu.deb"
        },
        {
          "id": 447570366,
          "name": "tv-0.15.9-aarch64-unknown-linux-gnu.deb.sha256",
          "size": 106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 447569992,
          "name": "tv-0.15.9-aarch64-unknown-linux-gnu.sha256",
          "size": 109,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-unknown-linux-gnu.sha256"
        },
        {
          "id": 447569994,
          "name": "tv-0.15.9-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3670785,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 447569829,
          "name": "tv-0.15.9-i686-unknown-linux-gnu.sha256",
          "size": 106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-i686-unknown-linux-gnu.sha256"
        },
        {
          "id": 447569830,
          "name": "tv-0.15.9-i686-unknown-linux-gnu.tar.gz",
          "size": 3821952,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 447570865,
          "name": "tv-0.15.9-x86_64-apple-darwin.sha256",
          "size": 103,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-apple-darwin.sha256"
        },
        {
          "id": 447570866,
          "name": "tv-0.15.9-x86_64-apple-darwin.tar.gz",
          "size": 3798731,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 447571004,
          "name": "tv-0.15.9-x86_64-pc-windows-msvc.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-pc-windows-msvc.sha256"
        },
        {
          "id": 447571006,
          "name": "tv-0.15.9-x86_64-pc-windows-msvc.tar.gz",
          "size": 3908001,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 447571007,
          "name": "tv-0.15.9-x86_64-pc-windows-msvc.zip",
          "size": 3742809,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 447571005,
          "name": "tv-0.15.9-x86_64-pc-windows-msvc.zip.sha256",
          "size": 66,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 447570237,
          "name": "tv-0.15.9-x86_64-unknown-linux-gnu.deb",
          "size": 2801768,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-gnu.deb"
        },
        {
          "id": 447570235,
          "name": "tv-0.15.9-x86_64-unknown-linux-gnu.deb.sha256",
          "size": 105,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 447569482,
          "name": "tv-0.15.9-x86_64-unknown-linux-gnu.sha256",
          "size": 108,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-gnu.sha256"
        },
        {
          "id": 447569483,
          "name": "tv-0.15.9-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3973724,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 447570336,
          "name": "tv-0.15.9-x86_64-unknown-linux-musl.deb",
          "size": 2878132,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-musl.deb"
        },
        {
          "id": 447570337,
          "name": "tv-0.15.9-x86_64-unknown-linux-musl.deb.sha256",
          "size": 106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-musl.deb.sha256"
        },
        {
          "id": 447569673,
          "name": "tv-0.15.9-x86_64-unknown-linux-musl.sha256",
          "size": 109,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-musl.sha256"
        },
        {
          "id": 447569675,
          "name": "tv-0.15.9-x86_64-unknown-linux-musl.tar.gz",
          "size": 4051029,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/alexpasmantier/television/releases/download/0.15.9/tv-0.15.9-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "tv": "tv-0.15.9-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "tv": "tv-0.15.9-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "tv": "tv-0.15.9-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "tv": "tv-0.15.9-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "amir20/dtop",
      "version": "v0.7.7"
    },
    "release": {
      "tag_name": "v0.7.7",
      "assets": [
        {
          "id": 439307899,
          "name": "dist-manifest.json",
          "size": 16231,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dist-manifest.json"
        },
        {
          "id": 439307904,
          "name": "dtop-aarch64-apple-darwin.tar.gz",
          "size": 3134612,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439307901,
          "name": "dtop-aarch64-apple-darwin.tar.gz.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-aarch64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 439307900,
          "name": "dtop-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3256280,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439307903,
          "name": "dtop-aarch64-unknown-linux-gnu.tar.gz.sha256",
          "size": 105,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-aarch64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 439307909,
          "name": "dtop-installer.sh",
          "size": 51366,
          "content_type": "application/x-shellscript",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-installer.sh"
        },
        {
          "id": 439307913,
          "name": "dtop-x86_64-apple-darwin.tar.gz",
          "size": 3149702,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439307916,
          "name": "dtop-x86_64-apple-darwin.tar.gz.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-x86_64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 439307919,
          "name": "dtop-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3238340,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439307924,
          "name": "dtop-x86_64-unknown-linux-gnu.tar.gz.sha256",
          "size": 104,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/dtop-x86_64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 439307926,
          "name": "sha256.sum",
          "size": 485,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/sha256.sum"
        },
        {
          "id": 439307930,
          "name": "source.tar.gz",
          "size": 1635065,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/source.tar.gz"
        },
        {
          "id": 439307931,
          "name": "source.tar.gz.sha256",
          "size": 81,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/amir20/dtop/releases/download/v0.7.7/source.tar.gz.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "dtop": "dtop-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "dtop": "dtop-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "dtop": "dtop-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "dtop": "dtop-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "antonmedv/fx",
      "version": "39.2.0"
    },
    "release": {
      "tag_name": "39.2.0",
      "assets": [
        {
          "id": 315468986,
          "name": "fx_darwin_amd64",
          "size": 17984928,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_darwin_amd64"
        },
        {
          "id": 315468988,
          "name": "fx_darwin_arm64",
          "size": 17640450,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_darwin_arm64"
        },
        {
          "id": 315468989,
          "name": "fx_linux_amd64",
          "size": 18104523,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_linux_amd64"
        },
        {
          "id": 315468985,
          "name": "fx_linux_arm64",
          "size": 17639716,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_linux_arm64"
        },
        {
          "id": 315468991,
          "name": "fx_windows_amd64.exe",
          "size": 18734592,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_windows_amd64.exe"
        },
        {
          "id": 315468987,
          "name": "fx_windows_arm64.exe",
          "size": 18041856,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/antonmedv/fx/releases/download/39.2.0/fx_windows_arm64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "fx": "fx_linux_amd64"
      },
      "linux-arm64": {
        "fx": "fx_linux_arm64"
      },
      "darwin-x64": {
        "fx": "fx_darwin_amd64"
      },
      "darwin-arm64": {
        "fx": "fx_darwin_arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "ast-grep/ast-grep",
      "version": "0.43.0"
    },
    "release": {
      "tag_name": "0.43.0",
      "assets": [
        {
          "id": 429542766,
          "name": "app-aarch64-apple-darwin.zip",
          "size": 7997957,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-aarch64-apple-darwin.zip"
        },
        {
          "id": 429543862,
          "name": "app-aarch64-pc-windows-msvc.zip",
          "size": 7177619,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 429542920,
          "name": "app-aarch64-unknown-linux-gnu.zip",
          "size": 7872274,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-aarch64-unknown-linux-gnu.zip"
        },
        {
          "id": 429543556,
          "name": "app-i686-pc-windows-msvc.zip",
          "size": 7097169,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-i686-pc-windows-msvc.zip"
        },
        {
          "id": 429542599,
          "name": "app-x86_64-apple-darwin.zip",
          "size": 8021391,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-x86_64-apple-darwin.zip"
        },
        {
          "id": 429546361,
          "name": "app-x86_64-pc-windows-msvc.zip",
          "size": 7493668,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 429542387,
          "name": "app-x86_64-unknown-linux-gnu.zip",
          "size": 8143119,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ast-grep/ast-grep/releases/download/0.43.0/app-x86_64-unknown-linux-gnu.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "sg": "app-x86_64-unknown-linux-gnu.zip"
      },
      "linux-arm64": {
        "sg": "app-aarch64-unknown-linux-gnu.zip"
      },
      "darwin-x64": {
        "sg": "app-x86_64-apple-darwin.zip"
      },
      "darwin-arm64": {
        "sg": "app-aarch64-apple-darwin.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "astral-sh/uv",
      "version": "0.11.23",
      "assetHints": {
        "select": "uv-x86_64-unknown-linux-musl"
      }
    },
    "release": {
      "tag_name": "0.11.23",
      "assets": [
        {
          "id": 452403839,
          "name": "dist-manifest.json",
          "size": 44621,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/dist-manifest.json"
        },
        {
          "id": 452403838,
          "name": "sha256.sum",
          "size": 1901,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/sha256.sum"
        },
        {
          "id": 452403835,
          "name": "source.tar.gz",
          "size": 5483972,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/source.tar.gz"
        },
        {
          "id": 452403836,
          "name": "source.tar.gz.sha256",
          "size": 81,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/source.tar.gz.sha256"
        },
        {
          "id": 452403837,
          "name": "uv-aarch64-apple-darwin.tar.gz",
          "size": 21115327,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 452403847,
          "name": "uv-aarch64-apple-darwin.tar.gz.sha256",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 452403846,
          "name": "uv-aarch64-pc-windows-msvc.zip",
          "size": 22218761,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 452403848,
          "name": "uv-aarch64-pc-windows-msvc.zip.sha256",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 452403850,
          "name": "uv-aarch64-unknown-linux-gnu.tar.gz",
          "size": 23037927,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403851,
          "name": "uv-aarch64-unknown-linux-gnu.tar.gz.sha256",
          "size": 102,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403853,
          "name": "uv-aarch64-unknown-linux-musl.tar.gz",
          "size": 22912860,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452403854,
          "name": "uv-aarch64-unknown-linux-musl.tar.gz.sha256",
          "size": 103,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-aarch64-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 452403856,
          "name": "uv-arm-unknown-linux-musleabihf.tar.gz",
          "size": 23179252,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 452403859,
          "name": "uv-arm-unknown-linux-musleabihf.tar.gz.sha256",
          "size": 105,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-arm-unknown-linux-musleabihf.tar.gz.sha256"
        },
        {
          "id": 452403860,
          "name": "uv-armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 22764408,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 452403861,
          "name": "uv-armv7-unknown-linux-gnueabihf.tar.gz.sha256",
          "size": 106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-armv7-unknown-linux-gnueabihf.tar.gz.sha256"
        },
        {
          "id": 452403863,
          "name": "uv-armv7-unknown-linux-musleabihf.tar.gz",
          "size": 22727755,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 452403866,
          "name": "uv-armv7-unknown-linux-musleabihf.tar.gz.sha256",
          "size": 107,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-armv7-unknown-linux-musleabihf.tar.gz.sha256"
        },
        {
          "id": 452403867,
          "name": "uv-i686-pc-windows-msvc.zip",
          "size": 21719523,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-pc-windows-msvc.zip"
        },
        {
          "id": 452403869,
          "name": "uv-i686-pc-windows-msvc.zip.sha256",
          "size": 94,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 452403871,
          "name": "uv-i686-unknown-linux-gnu.tar.gz",
          "size": 24412878,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403874,
          "name": "uv-i686-unknown-linux-gnu.tar.gz.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403875,
          "name": "uv-i686-unknown-linux-musl.tar.gz",
          "size": 23637296,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452403877,
          "name": "uv-i686-unknown-linux-musl.tar.gz.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-i686-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 452403878,
          "name": "uv-installer.ps1",
          "size": 22658,
          "content_type": "application/x-powershell",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-installer.ps1"
        },
        {
          "id": 452403879,
          "name": "uv-installer.sh",
          "size": 71233,
          "content_type": "application/x-shellscript",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-installer.sh"
        },
        {
          "id": 452403884,
          "name": "uv-powerpc64le-unknown-linux-gnu.tar.gz",
          "size": 25299781,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-powerpc64le-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403887,
          "name": "uv-powerpc64le-unknown-linux-gnu.tar.gz.sha256",
          "size": 106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-powerpc64le-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403889,
          "name": "uv-riscv64gc-unknown-linux-gnu.tar.gz",
          "size": 24194978,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-riscv64gc-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403891,
          "name": "uv-riscv64gc-unknown-linux-gnu.tar.gz.sha256",
          "size": 104,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-riscv64gc-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403892,
          "name": "uv-riscv64gc-unknown-linux-musl.tar.gz",
          "size": 24085894,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-riscv64gc-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452403894,
          "name": "uv-riscv64gc-unknown-linux-musl.tar.gz.sha256",
          "size": 105,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-riscv64gc-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 452403895,
          "name": "uv-s390x-unknown-linux-gnu.tar.gz",
          "size": 24591040,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-s390x-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403900,
          "name": "uv-s390x-unknown-linux-gnu.tar.gz.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-s390x-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403902,
          "name": "uv-x86_64-apple-darwin.tar.gz",
          "size": 22586934,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 452403904,
          "name": "uv-x86_64-apple-darwin.tar.gz.sha256",
          "size": 96,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 452403903,
          "name": "uv-x86_64-pc-windows-msvc.zip",
          "size": 23758102,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 452403910,
          "name": "uv-x86_64-pc-windows-msvc.zip.sha256",
          "size": 96,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 452403913,
          "name": "uv-x86_64-unknown-linux-gnu.tar.gz",
          "size": 24688697,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452403914,
          "name": "uv-x86_64-unknown-linux-gnu.tar.gz.sha256",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 452403917,
          "name": "uv-x86_64-unknown-linux-musl.tar.gz",
          "size": 24903235,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452403921,
          "name": "uv-x86_64-unknown-linux-musl.tar.gz.sha256",
          "size": 102,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/astral-sh/uv/releases/download/0.11.23/uv-x86_64-unknown-linux-musl.tar.gz.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "uv": "uv-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "uv": "uv-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "uv": "uv-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "uv": "uv-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Ataraxy-Labs/weave"
    },
    "release": {
      "tag_name": "v0.3.6",
      "assets": [
        {
          "id": 439565745,
          "name": "checksums.txt",
          "size": 1917,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/checksums.txt"
        },
        {
          "id": 439565754,
          "name": "weave-cli-aarch64-apple-darwin.tar.gz",
          "size": 8009944,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565747,
          "name": "weave-cli-aarch64-unknown-linux-gnu.tar.gz",
          "size": 7894606,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565752,
          "name": "weave-cli-x86_64-apple-darwin.tar.gz",
          "size": 8136606,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565743,
          "name": "weave-cli-x86_64-pc-windows-msvc.tar.gz",
          "size": 8070738,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565757,
          "name": "weave-cli-x86_64-pc-windows-msvc.zip",
          "size": 8076941,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565751,
          "name": "weave-cli-x86_64-unknown-linux-gnu.tar.gz",
          "size": 8047299,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565753,
          "name": "weave-driver-aarch64-apple-darwin.tar.gz",
          "size": 6925362,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565748,
          "name": "weave-driver-aarch64-unknown-linux-gnu.tar.gz",
          "size": 6747289,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565755,
          "name": "weave-driver-x86_64-apple-darwin.tar.gz",
          "size": 6978813,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565741,
          "name": "weave-driver-x86_64-pc-windows-msvc.tar.gz",
          "size": 7019193,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565756,
          "name": "weave-driver-x86_64-pc-windows-msvc.zip",
          "size": 7022309,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565750,
          "name": "weave-driver-x86_64-unknown-linux-gnu.tar.gz",
          "size": 6836799,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565742,
          "name": "weave-mcp-aarch64-apple-darwin.tar.gz",
          "size": 9045120,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565749,
          "name": "weave-mcp-aarch64-unknown-linux-gnu.tar.gz",
          "size": 8996499,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565744,
          "name": "weave-mcp-x86_64-apple-darwin.tar.gz",
          "size": 9222242,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565740,
          "name": "weave-mcp-x86_64-pc-windows-msvc.tar.gz",
          "size": 9028578,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565758,
          "name": "weave-mcp-x86_64-pc-windows-msvc.zip",
          "size": 9032881,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565746,
          "name": "weave-mcp-x86_64-unknown-linux-gnu.tar.gz",
          "size": 9165926,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-unknown-linux-gnu.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "weave": "weave-cli-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "weave": "weave-cli-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "weave": "weave-cli-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "weave": "weave-cli-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Ataraxy-Labs/weave",
      "binaries": [
        {
          "name": "weave-driver"
        }
      ],
      "assetHints": {
        "select": "weave-driver"
      }
    },
    "release": {
      "tag_name": "v0.3.6",
      "assets": [
        {
          "id": 439565745,
          "name": "checksums.txt",
          "size": 1917,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/checksums.txt"
        },
        {
          "id": 439565754,
          "name": "weave-cli-aarch64-apple-darwin.tar.gz",
          "size": 8009944,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565747,
          "name": "weave-cli-aarch64-unknown-linux-gnu.tar.gz",
          "size": 7894606,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565752,
          "name": "weave-cli-x86_64-apple-darwin.tar.gz",
          "size": 8136606,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565743,
          "name": "weave-cli-x86_64-pc-windows-msvc.tar.gz",
          "size": 8070738,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565757,
          "name": "weave-cli-x86_64-pc-windows-msvc.zip",
          "size": 8076941,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565751,
          "name": "weave-cli-x86_64-unknown-linux-gnu.tar.gz",
          "size": 8047299,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-cli-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565753,
          "name": "weave-driver-aarch64-apple-darwin.tar.gz",
          "size": 6925362,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565748,
          "name": "weave-driver-aarch64-unknown-linux-gnu.tar.gz",
          "size": 6747289,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565755,
          "name": "weave-driver-x86_64-apple-darwin.tar.gz",
          "size": 6978813,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565741,
          "name": "weave-driver-x86_64-pc-windows-msvc.tar.gz",
          "size": 7019193,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565756,
          "name": "weave-driver-x86_64-pc-windows-msvc.zip",
          "size": 7022309,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565750,
          "name": "weave-driver-x86_64-unknown-linux-gnu.tar.gz",
          "size": 6836799,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-driver-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565742,
          "name": "weave-mcp-aarch64-apple-darwin.tar.gz",
          "size": 9045120,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 439565749,
          "name": "weave-mcp-aarch64-unknown-linux-gnu.tar.gz",
          "size": 8996499,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 439565744,
          "name": "weave-mcp-x86_64-apple-darwin.tar.gz",
          "size": 9222242,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 439565740,
          "name": "weave-mcp-x86_64-pc-windows-msvc.tar.gz",
          "size": 9028578,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 439565758,
          "name": "weave-mcp-x86_64-pc-windows-msvc.zip",
          "size": 9032881,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 439565746,
          "name": "weave-mcp-x86_64-unknown-linux-gnu.tar.gz",
          "size": 9165926,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/Ataraxy-Labs/weave/releases/download/v0.3.6/weave-mcp-x86_64-unknown-linux-gnu.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "weave-driver": "weave-driver-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "weave-driver": "weave-driver-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "weave-driver": "weave-driver-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "weave-driver": "weave-driver-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "biomejs/biome",
      "version": "biomejs/biome@2.5.0"
    },
    "release": {
      "tag_name": "@biomejs/biome@2.5.0",
      "assets": [
        {
          "id": 445650510,
          "name": "biome-darwin-arm64",
          "size": 55002032,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-darwin-arm64"
        },
        {
          "id": 445650511,
          "name": "biome-darwin-x64",
          "size": 58041176,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-darwin-x64"
        },
        {
          "id": 445650509,
          "name": "biome-linux-arm64",
          "size": 57246320,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-linux-arm64"
        },
        {
          "id": 445650505,
          "name": "biome-linux-arm64-musl",
          "size": 55012944,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-linux-arm64-musl"
        },
        {
          "id": 445650507,
          "name": "biome-linux-x64",
          "size": 62644520,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-linux-x64"
        },
        {
          "id": 445650504,
          "name": "biome-linux-x64-musl",
          "size": 62685360,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-linux-x64-musl"
        },
        {
          "id": 445650506,
          "name": "biome-win32-arm64.exe",
          "size": 64972800,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-win32-arm64.exe"
        },
        {
          "id": 445650508,
          "name": "biome-win32-x64.exe",
          "size": 79243776,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.5.0/biome-win32-x64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "biome": "biome-linux-x64"
      },
      "linux-arm64": {
        "biome": "biome-linux-arm64"
      },
      "darwin-x64": {
        "biome": "biome-darwin-x64"
      },
      "darwin-arm64": {
        "biome": "biome-darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "blopker/codebook",
      "version": "v0.3.41"
    },
    "release": {
      "tag_name": "v0.3.41",
      "assets": [
        {
          "id": 430475780,
          "name": "codebook-lsp-aarch64-apple-darwin.tar.gz",
          "size": 9242044,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 430475776,
          "name": "codebook-lsp-aarch64-pc-windows-msvc.zip",
          "size": 7829108,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 430475781,
          "name": "codebook-lsp-aarch64-unknown-linux-musl.tar.gz",
          "size": 9282632,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 430475775,
          "name": "codebook-lsp-x86_64-apple-darwin.tar.gz",
          "size": 9229643,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 430475777,
          "name": "codebook-lsp-x86_64-pc-windows-msvc.zip",
          "size": 7988579,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 430475779,
          "name": "codebook-lsp-x86_64-unknown-linux-musl.tar.gz",
          "size": 9668435,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/blopker/codebook/releases/download/v0.3.41/codebook-lsp-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "codebook": "codebook-lsp-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "codebook": "codebook-lsp-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "codebook": "codebook-lsp-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "codebook": "codebook-lsp-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "BurntSushi/ripgrep"
    },
    "release": {
      "tag_name": "15.1.0",
      "assets": [
        {
          "id": 307305438,
          "name": "ripgrep-15.1.0-aarch64-apple-darwin.tar.gz",
          "size": 1777930,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 307305440,
          "name": "ripgrep-15.1.0-aarch64-apple-darwin.tar.gz.sha256",
          "size": 109,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 307305789,
          "name": "ripgrep-15.1.0-aarch64-pc-windows-msvc.zip",
          "size": 1675460,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 307305788,
          "name": "ripgrep-15.1.0-aarch64-pc-windows-msvc.zip.sha256",
          "size": 179,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 307306472,
          "name": "ripgrep-15.1.0-aarch64-unknown-linux-gnu.tar.gz",
          "size": 1869959,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 307306473,
          "name": "ripgrep-15.1.0-aarch64-unknown-linux-gnu.tar.gz.sha256",
          "size": 114,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-aarch64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 307306444,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 1831905,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 307306443,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-gnueabihf.tar.gz.sha256",
          "size": 118,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-gnueabihf.tar.gz.sha256"
        },
        {
          "id": 307306311,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-musleabi.tar.gz",
          "size": 1831202,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-musleabi.tar.gz"
        },
        {
          "id": 307306312,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-musleabi.tar.gz.sha256",
          "size": 117,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-musleabi.tar.gz.sha256"
        },
        {
          "id": 307305932,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-musleabihf.tar.gz",
          "size": 1844969,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 307305933,
          "name": "ripgrep-15.1.0-armv7-unknown-linux-musleabihf.tar.gz.sha256",
          "size": 119,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-armv7-unknown-linux-musleabihf.tar.gz.sha256"
        },
        {
          "id": 307306474,
          "name": "ripgrep-15.1.0-i686-pc-windows-msvc.zip",
          "size": 1665725,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-i686-pc-windows-msvc.zip"
        },
        {
          "id": 307306475,
          "name": "ripgrep-15.1.0-i686-pc-windows-msvc.zip.sha256",
          "size": 176,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-i686-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 307306383,
          "name": "ripgrep-15.1.0-i686-unknown-linux-gnu.tar.gz",
          "size": 1950407,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 307306382,
          "name": "ripgrep-15.1.0-i686-unknown-linux-gnu.tar.gz.sha256",
          "size": 111,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-i686-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 307306519,
          "name": "ripgrep-15.1.0-s390x-unknown-linux-gnu.tar.gz",
          "size": 2441054,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-s390x-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 307306521,
          "name": "ripgrep-15.1.0-s390x-unknown-linux-gnu.tar.gz.sha256",
          "size": 112,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-s390x-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 307305422,
          "name": "ripgrep-15.1.0-x86_64-apple-darwin.tar.gz",
          "size": 1894127,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 307305423,
          "name": "ripgrep-15.1.0-x86_64-apple-darwin.tar.gz.sha256",
          "size": 108,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 307306053,
          "name": "ripgrep-15.1.0-x86_64-pc-windows-gnu.zip",
          "size": 1897509,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-pc-windows-gnu.zip"
        },
        {
          "id": 307306052,
          "name": "ripgrep-15.1.0-x86_64-pc-windows-gnu.zip.sha256",
          "size": 177,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-pc-windows-gnu.zip.sha256"
        },
        {
          "id": 307305871,
          "name": "ripgrep-15.1.0-x86_64-pc-windows-msvc.zip",
          "size": 1810687,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 307305872,
          "name": "ripgrep-15.1.0-x86_64-pc-windows-msvc.zip.sha256",
          "size": 178,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 307306614,
          "name": "ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 2263077,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 307306613,
          "name": "ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz.sha256",
          "size": 114,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 307306229,
          "name": "ripgrep_15.1.0-1_amd64.deb",
          "size": 1704160,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep_15.1.0-1_amd64.deb"
        },
        {
          "id": 307306230,
          "name": "ripgrep_15.1.0-1_amd64.deb.sha256",
          "size": 93,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/BurntSushi/ripgrep/releases/download/15.1.0/ripgrep_15.1.0-1_amd64.deb.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "rg": "ripgrep-15.1.0-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "rg": "ripgrep-15.1.0-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "rg": "ripgrep-15.1.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "rg": "ripgrep-15.1.0-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Byron/dua-cli"
    },
    "release": {
      "tag_name": "v2.36.0",
      "assets": [
        {
          "id": 449932877,
          "name": "dua-v2.36.0-aarch64-unknown-linux-musl.tar.gz",
          "size": 1859180,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 449932846,
          "name": "dua-v2.36.0-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 1880912,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 449933697,
          "name": "dua-v2.36.0-i686-pc-windows-msvc.zip",
          "size": 1680286,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-i686-pc-windows-msvc.zip"
        },
        {
          "id": 449931739,
          "name": "dua-v2.36.0-x86_64-apple-darwin.tar.gz",
          "size": 1768276,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 449933200,
          "name": "dua-v2.36.0-x86_64-pc-windows-msvc.zip",
          "size": 1680309,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 449932450,
          "name": "dua-v2.36.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 1984161,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Byron/dua-cli/releases/download/v2.36.0/dua-v2.36.0-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "dua": "dua-v2.36.0-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "dua": "dua-v2.36.0-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "dua": "dua-v2.36.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "dua": null
      }
    }
  },
  {
    "pkg": {
      "repo": "ByteNess/aws-vault",
      "version": "v7.12.3"
    },
    "release": {
      "tag_name": "v7.12.3",
      "assets": [
        {
          "id": 451594432,
          "name": "aws-vault-darwin-amd64",
          "size": 29554408,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-darwin-amd64"
        },
        {
          "id": 451594437,
          "name": "aws-vault-darwin-arm64",
          "size": 28294466,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-darwin-arm64"
        },
        {
          "id": 451594434,
          "name": "aws-vault-freebsd-amd64",
          "size": 13217964,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-freebsd-amd64"
        },
        {
          "id": 451594436,
          "name": "aws-vault-linux-amd64",
          "size": 17362632,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-linux-amd64"
        },
        {
          "id": 451594435,
          "name": "aws-vault-linux-arm64",
          "size": 16365708,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-linux-arm64"
        },
        {
          "id": 451594431,
          "name": "aws-vault-linux-ppc64le",
          "size": 16226392,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-linux-ppc64le"
        },
        {
          "id": 451594433,
          "name": "aws-vault-windows-amd64.exe",
          "size": 29994496,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-windows-amd64.exe"
        },
        {
          "id": 451594430,
          "name": "aws-vault-windows-arm64.exe",
          "size": 28292096,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault-windows-arm64.exe"
        },
        {
          "id": 451594429,
          "name": "aws-vault_sha256_checksums.txt",
          "size": 722,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/ByteNess/aws-vault/releases/download/v7.12.3/aws-vault_sha256_checksums.txt"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "aws-vault": "aws-vault-linux-amd64"
      },
      "linux-arm64": {
        "aws-vault": "aws-vault-linux-arm64"
      },
      "darwin-x64": {
        "aws-vault": "aws-vault-darwin-amd64"
      },
      "darwin-arm64": {
        "aws-vault": "aws-vault-darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "caddyserver/caddy"
    },
    "release": {
      "tag_name": "v2.11.4",
      "assets": [
        {
          "id": 436912459,
          "name": "caddy_2.11.4_buildable-artifact.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_buildable-artifact.pem"
        },
        {
          "id": 436912344,
          "name": "caddy_2.11.4_buildable-artifact.tar.gz",
          "size": 11306896,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_buildable-artifact.tar.gz"
        },
        {
          "id": 436912456,
          "name": "caddy_2.11.4_buildable-artifact.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_buildable-artifact.tar.gz.sig"
        },
        {
          "id": 436912404,
          "name": "caddy_2.11.4_checksums.txt",
          "size": 6769,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_checksums.txt"
        },
        {
          "id": 436912567,
          "name": "caddy_2.11.4_checksums.txt.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_checksums.txt.pem"
        },
        {
          "id": 436912565,
          "name": "caddy_2.11.4_checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_checksums.txt.sig"
        },
        {
          "id": 436912445,
          "name": "caddy_2.11.4_freebsd_amd64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.pem"
        },
        {
          "id": 436912398,
          "name": "caddy_2.11.4_freebsd_amd64.sbom",
          "size": 141488,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.sbom"
        },
        {
          "id": 436912553,
          "name": "caddy_2.11.4_freebsd_amd64.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.sbom.pem"
        },
        {
          "id": 436912551,
          "name": "caddy_2.11.4_freebsd_amd64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.sbom.sig"
        },
        {
          "id": 436912326,
          "name": "caddy_2.11.4_freebsd_amd64.tar.gz",
          "size": 17164304,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.tar.gz"
        },
        {
          "id": 436912444,
          "name": "caddy_2.11.4_freebsd_amd64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_amd64.tar.gz.sig"
        },
        {
          "id": 436912412,
          "name": "caddy_2.11.4_freebsd_arm64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.pem"
        },
        {
          "id": 436912402,
          "name": "caddy_2.11.4_freebsd_arm64.sbom",
          "size": 141490,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.sbom"
        },
        {
          "id": 436912561,
          "name": "caddy_2.11.4_freebsd_arm64.sbom.pem",
          "size": 3280,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.sbom.pem"
        },
        {
          "id": 436912560,
          "name": "caddy_2.11.4_freebsd_arm64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.sbom.sig"
        },
        {
          "id": 436912302,
          "name": "caddy_2.11.4_freebsd_arm64.tar.gz",
          "size": 15633819,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.tar.gz"
        },
        {
          "id": 436912411,
          "name": "caddy_2.11.4_freebsd_arm64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_arm64.tar.gz.sig"
        },
        {
          "id": 436912447,
          "name": "caddy_2.11.4_freebsd_armv6.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.pem"
        },
        {
          "id": 436912399,
          "name": "caddy_2.11.4_freebsd_armv6.sbom",
          "size": 141195,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.sbom"
        },
        {
          "id": 436912555,
          "name": "caddy_2.11.4_freebsd_armv6.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.sbom.pem"
        },
        {
          "id": 436912554,
          "name": "caddy_2.11.4_freebsd_armv6.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.sbom.sig"
        },
        {
          "id": 436912332,
          "name": "caddy_2.11.4_freebsd_armv6.tar.gz",
          "size": 16273034,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.tar.gz"
        },
        {
          "id": 436912446,
          "name": "caddy_2.11.4_freebsd_armv6.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv6.tar.gz.sig"
        },
        {
          "id": 436912407,
          "name": "caddy_2.11.4_freebsd_armv7.pem",
          "size": 3280,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.pem"
        },
        {
          "id": 436912401,
          "name": "caddy_2.11.4_freebsd_armv7.sbom",
          "size": 141195,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.sbom"
        },
        {
          "id": 436912557,
          "name": "caddy_2.11.4_freebsd_armv7.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.sbom.pem"
        },
        {
          "id": 436912556,
          "name": "caddy_2.11.4_freebsd_armv7.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.sbom.sig"
        },
        {
          "id": 436912305,
          "name": "caddy_2.11.4_freebsd_armv7.tar.gz",
          "size": 16256618,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.tar.gz"
        },
        {
          "id": 436912406,
          "name": "caddy_2.11.4_freebsd_armv7.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_freebsd_armv7.tar.gz.sig"
        },
        {
          "id": 436912360,
          "name": "caddy_2.11.4_linux_amd64.deb",
          "size": 17265372,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.deb"
        },
        {
          "id": 436912480,
          "name": "caddy_2.11.4_linux_amd64.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.deb.pem"
        },
        {
          "id": 436912479,
          "name": "caddy_2.11.4_linux_amd64.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.deb.sig"
        },
        {
          "id": 436912428,
          "name": "caddy_2.11.4_linux_amd64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.pem"
        },
        {
          "id": 436912378,
          "name": "caddy_2.11.4_linux_amd64.sbom",
          "size": 141486,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.sbom"
        },
        {
          "id": 436912509,
          "name": "caddy_2.11.4_linux_amd64.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.sbom.pem"
        },
        {
          "id": 436912506,
          "name": "caddy_2.11.4_linux_amd64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.sbom.sig"
        },
        {
          "id": 436912315,
          "name": "caddy_2.11.4_linux_amd64.tar.gz",
          "size": 17238873,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.tar.gz"
        },
        {
          "id": 436912429,
          "name": "caddy_2.11.4_linux_amd64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_amd64.tar.gz.sig"
        },
        {
          "id": 436912363,
          "name": "caddy_2.11.4_linux_arm64.deb",
          "size": 15731662,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.deb"
        },
        {
          "id": 436912498,
          "name": "caddy_2.11.4_linux_arm64.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.deb.pem"
        },
        {
          "id": 436912496,
          "name": "caddy_2.11.4_linux_arm64.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.deb.sig"
        },
        {
          "id": 436912432,
          "name": "caddy_2.11.4_linux_arm64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.pem"
        },
        {
          "id": 436912389,
          "name": "caddy_2.11.4_linux_arm64.sbom",
          "size": 141488,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.sbom"
        },
        {
          "id": 436912527,
          "name": "caddy_2.11.4_linux_arm64.sbom.pem",
          "size": 3280,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.sbom.pem"
        },
        {
          "id": 436912526,
          "name": "caddy_2.11.4_linux_arm64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.sbom.sig"
        },
        {
          "id": 436912318,
          "name": "caddy_2.11.4_linux_arm64.tar.gz",
          "size": 15704974,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.tar.gz"
        },
        {
          "id": 436912433,
          "name": "caddy_2.11.4_linux_arm64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_arm64.tar.gz.sig"
        },
        {
          "id": 436912350,
          "name": "caddy_2.11.4_linux_armv5.deb",
          "size": 16372308,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.deb"
        },
        {
          "id": 436912465,
          "name": "caddy_2.11.4_linux_armv5.deb.pem",
          "size": 3280,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.deb.pem"
        },
        {
          "id": 436912463,
          "name": "caddy_2.11.4_linux_armv5.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.deb.sig"
        },
        {
          "id": 436912410,
          "name": "caddy_2.11.4_linux_armv5.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.pem"
        },
        {
          "id": 436912375,
          "name": "caddy_2.11.4_linux_armv5.sbom",
          "size": 141193,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.sbom"
        },
        {
          "id": 436912504,
          "name": "caddy_2.11.4_linux_armv5.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.sbom.pem"
        },
        {
          "id": 436912505,
          "name": "caddy_2.11.4_linux_armv5.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.sbom.sig"
        },
        {
          "id": 436912303,
          "name": "caddy_2.11.4_linux_armv5.tar.gz",
          "size": 16348909,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.tar.gz"
        },
        {
          "id": 436912408,
          "name": "caddy_2.11.4_linux_armv5.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv5.tar.gz.sig"
        },
        {
          "id": 436912353,
          "name": "caddy_2.11.4_linux_armv6.deb",
          "size": 16367882,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.deb"
        },
        {
          "id": 436912469,
          "name": "caddy_2.11.4_linux_armv6.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.deb.pem"
        },
        {
          "id": 436912470,
          "name": "caddy_2.11.4_linux_armv6.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.deb.sig"
        },
        {
          "id": 436912457,
          "name": "caddy_2.11.4_linux_armv6.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.pem"
        },
        {
          "id": 436912384,
          "name": "caddy_2.11.4_linux_armv6.sbom",
          "size": 141193,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.sbom"
        },
        {
          "id": 436912519,
          "name": "caddy_2.11.4_linux_armv6.sbom.pem",
          "size": 3292,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.sbom.pem"
        },
        {
          "id": 436912516,
          "name": "caddy_2.11.4_linux_armv6.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.sbom.sig"
        },
        {
          "id": 436912336,
          "name": "caddy_2.11.4_linux_armv6.tar.gz",
          "size": 16339422,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.tar.gz"
        },
        {
          "id": 436912458,
          "name": "caddy_2.11.4_linux_armv6.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv6.tar.gz.sig"
        },
        {
          "id": 436912362,
          "name": "caddy_2.11.4_linux_armv7.deb",
          "size": 16349804,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.deb"
        },
        {
          "id": 436912483,
          "name": "caddy_2.11.4_linux_armv7.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.deb.pem"
        },
        {
          "id": 436912481,
          "name": "caddy_2.11.4_linux_armv7.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.deb.sig"
        },
        {
          "id": 436912425,
          "name": "caddy_2.11.4_linux_armv7.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.pem"
        },
        {
          "id": 436912386,
          "name": "caddy_2.11.4_linux_armv7.sbom",
          "size": 141193,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.sbom"
        },
        {
          "id": 436912522,
          "name": "caddy_2.11.4_linux_armv7.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.sbom.pem"
        },
        {
          "id": 436912521,
          "name": "caddy_2.11.4_linux_armv7.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.sbom.sig"
        },
        {
          "id": 436912312,
          "name": "caddy_2.11.4_linux_armv7.tar.gz",
          "size": 16324474,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.tar.gz"
        },
        {
          "id": 436912420,
          "name": "caddy_2.11.4_linux_armv7.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_armv7.tar.gz.sig"
        },
        {
          "id": 436912371,
          "name": "caddy_2.11.4_linux_ppc64le.deb",
          "size": 15724608,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.deb"
        },
        {
          "id": 436912503,
          "name": "caddy_2.11.4_linux_ppc64le.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.deb.pem"
        },
        {
          "id": 436912501,
          "name": "caddy_2.11.4_linux_ppc64le.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.deb.sig"
        },
        {
          "id": 436912437,
          "name": "caddy_2.11.4_linux_ppc64le.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.pem"
        },
        {
          "id": 436912391,
          "name": "caddy_2.11.4_linux_ppc64le.sbom",
          "size": 141782,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.sbom"
        },
        {
          "id": 436912530,
          "name": "caddy_2.11.4_linux_ppc64le.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.sbom.pem"
        },
        {
          "id": 436912529,
          "name": "caddy_2.11.4_linux_ppc64le.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.sbom.sig"
        },
        {
          "id": 436912320,
          "name": "caddy_2.11.4_linux_ppc64le.tar.gz",
          "size": 15699315,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.tar.gz"
        },
        {
          "id": 436912434,
          "name": "caddy_2.11.4_linux_ppc64le.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_ppc64le.tar.gz.sig"
        },
        {
          "id": 436912354,
          "name": "caddy_2.11.4_linux_riscv64.deb",
          "size": 16274994,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.deb"
        },
        {
          "id": 436912475,
          "name": "caddy_2.11.4_linux_riscv64.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.deb.pem"
        },
        {
          "id": 436912471,
          "name": "caddy_2.11.4_linux_riscv64.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.deb.sig"
        },
        {
          "id": 436912443,
          "name": "caddy_2.11.4_linux_riscv64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.pem"
        },
        {
          "id": 436912393,
          "name": "caddy_2.11.4_linux_riscv64.sbom",
          "size": 141784,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.sbom"
        },
        {
          "id": 436912532,
          "name": "caddy_2.11.4_linux_riscv64.sbom.pem",
          "size": 3292,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.sbom.pem"
        },
        {
          "id": 436912533,
          "name": "caddy_2.11.4_linux_riscv64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.sbom.sig"
        },
        {
          "id": 436912323,
          "name": "caddy_2.11.4_linux_riscv64.tar.gz",
          "size": 16249746,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.tar.gz"
        },
        {
          "id": 436912440,
          "name": "caddy_2.11.4_linux_riscv64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_riscv64.tar.gz.sig"
        },
        {
          "id": 436912368,
          "name": "caddy_2.11.4_linux_s390x.deb",
          "size": 16603924,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.deb"
        },
        {
          "id": 436912500,
          "name": "caddy_2.11.4_linux_s390x.deb.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.deb.pem"
        },
        {
          "id": 436912499,
          "name": "caddy_2.11.4_linux_s390x.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.deb.sig"
        },
        {
          "id": 436912431,
          "name": "caddy_2.11.4_linux_s390x.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.pem"
        },
        {
          "id": 436912387,
          "name": "caddy_2.11.4_linux_s390x.sbom",
          "size": 141483,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.sbom"
        },
        {
          "id": 436912525,
          "name": "caddy_2.11.4_linux_s390x.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.sbom.pem"
        },
        {
          "id": 436912524,
          "name": "caddy_2.11.4_linux_s390x.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.sbom.sig"
        },
        {
          "id": 436912314,
          "name": "caddy_2.11.4_linux_s390x.tar.gz",
          "size": 16577704,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.tar.gz"
        },
        {
          "id": 436912430,
          "name": "caddy_2.11.4_linux_s390x.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_linux_s390x.tar.gz.sig"
        },
        {
          "id": 436912452,
          "name": "caddy_2.11.4_mac_amd64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.pem"
        },
        {
          "id": 436912380,
          "name": "caddy_2.11.4_mac_amd64.sbom",
          "size": 141377,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.sbom"
        },
        {
          "id": 436912511,
          "name": "caddy_2.11.4_mac_amd64.sbom.pem",
          "size": 3280,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.sbom.pem"
        },
        {
          "id": 436912510,
          "name": "caddy_2.11.4_mac_amd64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.sbom.sig"
        },
        {
          "id": 436912339,
          "name": "caddy_2.11.4_mac_amd64.tar.gz",
          "size": 17631734,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.tar.gz"
        },
        {
          "id": 436912451,
          "name": "caddy_2.11.4_mac_amd64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_amd64.tar.gz.sig"
        },
        {
          "id": 436912417,
          "name": "caddy_2.11.4_mac_arm64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.pem"
        },
        {
          "id": 436912382,
          "name": "caddy_2.11.4_mac_arm64.sbom",
          "size": 141379,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.sbom"
        },
        {
          "id": 436912515,
          "name": "caddy_2.11.4_mac_arm64.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.sbom.pem"
        },
        {
          "id": 436912512,
          "name": "caddy_2.11.4_mac_arm64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.sbom.sig"
        },
        {
          "id": 436912311,
          "name": "caddy_2.11.4_mac_arm64.tar.gz",
          "size": 16448366,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.tar.gz"
        },
        {
          "id": 436912415,
          "name": "caddy_2.11.4_mac_arm64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_mac_arm64.tar.gz.sig"
        },
        {
          "id": 436912461,
          "name": "caddy_2.11.4_src.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_src.pem"
        },
        {
          "id": 436912346,
          "name": "caddy_2.11.4_src.tar.gz",
          "size": 11579294,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_src.tar.gz"
        },
        {
          "id": 436912462,
          "name": "caddy_2.11.4_src.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_src.tar.gz.sig"
        },
        {
          "id": 436912414,
          "name": "caddy_2.11.4_windows_amd64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.pem"
        },
        {
          "id": 436912394,
          "name": "caddy_2.11.4_windows_amd64.sbom",
          "size": 143666,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.sbom"
        },
        {
          "id": 436912541,
          "name": "caddy_2.11.4_windows_amd64.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.sbom.pem"
        },
        {
          "id": 436912536,
          "name": "caddy_2.11.4_windows_amd64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.sbom.sig"
        },
        {
          "id": 436912304,
          "name": "caddy_2.11.4_windows_amd64.zip",
          "size": 17559418,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.zip"
        },
        {
          "id": 436912413,
          "name": "caddy_2.11.4_windows_amd64.zip.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_amd64.zip.sig"
        },
        {
          "id": 436912449,
          "name": "caddy_2.11.4_windows_arm64.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.pem"
        },
        {
          "id": 436912396,
          "name": "caddy_2.11.4_windows_arm64.sbom",
          "size": 143668,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.sbom"
        },
        {
          "id": 436912547,
          "name": "caddy_2.11.4_windows_arm64.sbom.pem",
          "size": 3288,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.sbom.pem"
        },
        {
          "id": 436912546,
          "name": "caddy_2.11.4_windows_arm64.sbom.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.sbom.sig"
        },
        {
          "id": 436912334,
          "name": "caddy_2.11.4_windows_arm64.zip",
          "size": 15748221,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.zip"
        },
        {
          "id": 436912448,
          "name": "caddy_2.11.4_windows_arm64.zip.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/caddyserver/caddy/releases/download/v2.11.4/caddy_2.11.4_windows_arm64.zip.sig"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "caddy": "caddy_2.11.4_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "caddy": "caddy_2.11.4_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "caddy": "caddy_2.11.4_mac_amd64.tar.gz"
      },
      "darwin-arm64": {
        "caddy": "caddy_2.11.4_mac_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Canop/broot"
    },
    "release": {
      "tag_name": "v1.57.0",
      "assets": [
        {
          "id": 435311438,
          "name": "broot_1.57.0.zip",
          "size": 59035014,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Canop/broot/releases/download/v1.57.0/broot_1.57.0.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "broot": "broot_1.57.0.zip"
      },
      "linux-arm64": {
        "broot": "broot_1.57.0.zip"
      },
      "darwin-x64": {
        "broot": "broot_1.57.0.zip"
      },
      "darwin-arm64": {
        "broot": "broot_1.57.0.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "cantino/mcfly"
    },
    "release": {
      "tag_name": "v0.9.4",
      "assets": [
        {
          "id": 332612530,
          "name": "mcfly-v0.9.4-aarch64-unknown-linux-gnu.tar.gz",
          "size": 2157632,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 332612591,
          "name": "mcfly-v0.9.4-aarch64-unknown-linux-musl.tar.gz",
          "size": 2347732,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 332612555,
          "name": "mcfly-v0.9.4-arm-unknown-linux-gnueabi.tar.gz",
          "size": 2231541,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-arm-unknown-linux-gnueabi.tar.gz"
        },
        {
          "id": 332612558,
          "name": "mcfly-v0.9.4-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 2212850,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 332612547,
          "name": "mcfly-v0.9.4-armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 2141427,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 332612567,
          "name": "mcfly-v0.9.4-i686-unknown-linux-musl.tar.gz",
          "size": 2514424,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 332612386,
          "name": "mcfly-v0.9.4-x86_64-apple-darwin.tar.gz",
          "size": 2330147,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 332612663,
          "name": "mcfly-v0.9.4-x86_64-pc-windows-msvc.zip",
          "size": 2039332,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 332612565,
          "name": "mcfly-v0.9.4-x86_64-unknown-linux-musl.tar.gz",
          "size": 2488171,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/cantino/mcfly/releases/download/v0.9.4/mcfly-v0.9.4-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "mcfly": "mcfly-v0.9.4-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "mcfly": "mcfly-v0.9.4-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "mcfly": "mcfly-v0.9.4-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "mcfly": null
      }
    }
  },
  {
    "pkg": {
      "repo": "carvel-dev/ytt"
    },
    "release": {
      "tag_name": "v0.55.1",
      "assets": [
        {
          "id": 435171421,
          "name": "checksums.txt",
          "size": 590,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/checksums.txt"
        },
        {
          "id": 435171442,
          "name": "checksums.txt.pem",
          "size": 3260,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/checksums.txt.pem"
        },
        {
          "id": 435171434,
          "name": "checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/checksums.txt.sig"
        },
        {
          "id": 435171415,
          "name": "ytt-darwin-amd64",
          "size": 18373936,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-darwin-amd64"
        },
        {
          "id": 435171372,
          "name": "ytt-darwin-arm64",
          "size": 17268658,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-darwin-arm64"
        },
        {
          "id": 435171422,
          "name": "ytt-linux-amd64",
          "size": 17939469,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-linux-amd64"
        },
        {
          "id": 435171364,
          "name": "ytt-linux-arm64",
          "size": 16763628,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-linux-arm64"
        },
        {
          "id": 435171365,
          "name": "ytt-linux-riscv64",
          "size": 16485677,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-linux-riscv64"
        },
        {
          "id": 435171418,
          "name": "ytt-windows-amd64.exe",
          "size": 18228224,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-windows-amd64.exe"
        },
        {
          "id": 435171373,
          "name": "ytt-windows-arm64.exe",
          "size": 16768512,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/carvel-dev/ytt/releases/download/v0.55.1/ytt-windows-arm64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "ytt": "ytt-linux-amd64"
      },
      "linux-arm64": {
        "ytt": "ytt-linux-arm64"
      },
      "darwin-x64": {
        "ytt": "ytt-darwin-amd64"
      },
      "darwin-arm64": {
        "ytt": "ytt-darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "casey/just",
      "version": "1.53.0"
    },
    "release": {
      "tag_name": "1.53.0",
      "assets": [
        {
          "id": 449562870,
          "name": "CHANGELOG.md",
          "size": 183468,
          "content_type": "text/markdown",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/CHANGELOG.md"
        },
        {
          "id": 449562761,
          "name": "just-1.53.0-aarch64-apple-darwin.tar.gz",
          "size": 2050537,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 449564871,
          "name": "just-1.53.0-aarch64-pc-windows-msvc.zip",
          "size": 1938332,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 449563161,
          "name": "just-1.53.0-aarch64-unknown-linux-musl.tar.gz",
          "size": 2213668,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 449563088,
          "name": "just-1.53.0-arm-unknown-linux-musleabihf.tar.gz",
          "size": 2265853,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 449562886,
          "name": "just-1.53.0-armv7-unknown-linux-musleabihf.tar.gz",
          "size": 2221763,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 449562783,
          "name": "just-1.53.0-loongarch64-unknown-linux-musl.tar.gz",
          "size": 2219025,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-loongarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 449562817,
          "name": "just-1.53.0-riscv64gc-unknown-linux-musl.tar.gz",
          "size": 2286632,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-riscv64gc-unknown-linux-musl.tar.gz"
        },
        {
          "id": 449562706,
          "name": "just-1.53.0-x86_64-apple-darwin.tar.gz",
          "size": 2218542,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 449564031,
          "name": "just-1.53.0-x86_64-pc-windows-msvc.zip",
          "size": 2128128,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 449562852,
          "name": "just-1.53.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 2420438,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/just-1.53.0-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 449564930,
          "name": "SHA256SUMS",
          "size": 1184,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/casey/just/releases/download/1.53.0/SHA256SUMS"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "just": "just-1.53.0-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "just": "just-1.53.0-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "just": "just-1.53.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "just": "just-1.53.0-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "charmbracelet/glow"
    },
    "release": {
      "tag_name": "v2.1.2",
      "assets": [
        {
          "id": 392672392,
          "name": "checksums.txt",
          "size": 5300,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/checksums.txt"
        },
        {
          "id": 392672394,
          "name": "checksums.txt.sigstore.json",
          "size": 9977,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/checksums.txt.sigstore.json"
        },
        {
          "id": 392672350,
          "name": "glow-2.1.2-1.aarch64.rpm",
          "size": 5933784,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2-1.aarch64.rpm"
        },
        {
          "id": 392672351,
          "name": "glow-2.1.2-1.armv7hl.rpm",
          "size": 6244801,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2-1.armv7hl.rpm"
        },
        {
          "id": 392672352,
          "name": "glow-2.1.2-1.i386.rpm",
          "size": 6216866,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2-1.i386.rpm"
        },
        {
          "id": 392672349,
          "name": "glow-2.1.2-1.x86_64.rpm",
          "size": 6579735,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2-1.x86_64.rpm"
        },
        {
          "id": 392672340,
          "name": "glow-2.1.2.tar.gz",
          "size": 510279,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2.tar.gz"
        },
        {
          "id": 392672370,
          "name": "glow-2.1.2.tar.gz.sbom.json",
          "size": 144868,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow-2.1.2.tar.gz.sbom.json"
        },
        {
          "id": 392672348,
          "name": "glow_2.1.2_aarch64.apk",
          "size": 6179469,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_aarch64.apk"
        },
        {
          "id": 392672358,
          "name": "glow_2.1.2_amd64.deb",
          "size": 6587044,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_amd64.deb"
        },
        {
          "id": 392672356,
          "name": "glow_2.1.2_arm64.deb",
          "size": 5949656,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_arm64.deb"
        },
        {
          "id": 392672354,
          "name": "glow_2.1.2_armhf.deb",
          "size": 6270492,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_armhf.deb"
        },
        {
          "id": 392672347,
          "name": "glow_2.1.2_armv7.apk",
          "size": 6512216,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_armv7.apk"
        },
        {
          "id": 392672279,
          "name": "glow_2.1.2_Darwin_arm64.tar.gz",
          "size": 6186562,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Darwin_arm64.tar.gz"
        },
        {
          "id": 392672381,
          "name": "glow_2.1.2_Darwin_arm64.tar.gz.sbom.json",
          "size": 97373,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 392672278,
          "name": "glow_2.1.2_Darwin_x86_64.tar.gz",
          "size": 6685841,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Darwin_x86_64.tar.gz"
        },
        {
          "id": 392672385,
          "name": "glow_2.1.2_Darwin_x86_64.tar.gz.sbom.json",
          "size": 97563,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Darwin_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 392672270,
          "name": "glow_2.1.2_Freebsd_arm.tar.gz",
          "size": 6248949,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_arm.tar.gz"
        },
        {
          "id": 392672372,
          "name": "glow_2.1.2_Freebsd_arm.tar.gz.sbom.json",
          "size": 97183,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_arm.tar.gz.sbom.json"
        },
        {
          "id": 392672274,
          "name": "glow_2.1.2_Freebsd_arm64.tar.gz",
          "size": 5925345,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_arm64.tar.gz"
        },
        {
          "id": 392672378,
          "name": "glow_2.1.2_Freebsd_arm64.tar.gz.sbom.json",
          "size": 97563,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 392672272,
          "name": "glow_2.1.2_Freebsd_i386.tar.gz",
          "size": 6197384,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_i386.tar.gz"
        },
        {
          "id": 392672371,
          "name": "glow_2.1.2_Freebsd_i386.tar.gz.sbom.json",
          "size": 97373,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 392672277,
          "name": "glow_2.1.2_Freebsd_x86_64.tar.gz",
          "size": 6560020,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_x86_64.tar.gz"
        },
        {
          "id": 392672386,
          "name": "glow_2.1.2_Freebsd_x86_64.tar.gz.sbom.json",
          "size": 97753,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Freebsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 392672353,
          "name": "glow_2.1.2_i386.deb",
          "size": 6226804,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_i386.deb"
        },
        {
          "id": 392672273,
          "name": "glow_2.1.2_Linux_arm.tar.gz",
          "size": 6269844,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_arm.tar.gz"
        },
        {
          "id": 392672373,
          "name": "glow_2.1.2_Linux_arm.tar.gz.sbom.json",
          "size": 96803,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_arm.tar.gz.sbom.json"
        },
        {
          "id": 392672283,
          "name": "glow_2.1.2_Linux_arm64.tar.gz",
          "size": 5954660,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_arm64.tar.gz"
        },
        {
          "id": 392672383,
          "name": "glow_2.1.2_Linux_arm64.tar.gz.sbom.json",
          "size": 97183,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 392672285,
          "name": "glow_2.1.2_Linux_i386.tar.gz",
          "size": 6226933,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_i386.tar.gz"
        },
        {
          "id": 392672375,
          "name": "glow_2.1.2_Linux_i386.tar.gz.sbom.json",
          "size": 96993,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_i386.tar.gz.sbom.json"
        },
        {
          "id": 392672271,
          "name": "glow_2.1.2_Linux_x86_64.tar.gz",
          "size": 6586652,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_x86_64.tar.gz"
        },
        {
          "id": 392672384,
          "name": "glow_2.1.2_Linux_x86_64.tar.gz.sbom.json",
          "size": 97373,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Linux_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 392672276,
          "name": "glow_2.1.2_Netbsd_arm.tar.gz",
          "size": 6236287,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_arm.tar.gz"
        },
        {
          "id": 392672379,
          "name": "glow_2.1.2_Netbsd_arm.tar.gz.sbom.json",
          "size": 96993,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_arm.tar.gz.sbom.json"
        },
        {
          "id": 392672282,
          "name": "glow_2.1.2_Netbsd_arm64.tar.gz",
          "size": 5913773,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_arm64.tar.gz"
        },
        {
          "id": 392672382,
          "name": "glow_2.1.2_Netbsd_arm64.tar.gz.sbom.json",
          "size": 97373,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 392672275,
          "name": "glow_2.1.2_Netbsd_i386.tar.gz",
          "size": 6186485,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_i386.tar.gz"
        },
        {
          "id": 392672365,
          "name": "glow_2.1.2_Netbsd_i386.tar.gz.sbom.json",
          "size": 97183,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 392672346,
          "name": "glow_2.1.2_Netbsd_x86_64.tar.gz",
          "size": 6550164,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_x86_64.tar.gz"
        },
        {
          "id": 392672389,
          "name": "glow_2.1.2_Netbsd_x86_64.tar.gz.sbom.json",
          "size": 97563,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Netbsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 392672281,
          "name": "glow_2.1.2_Openbsd_arm.tar.gz",
          "size": 6244532,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_arm.tar.gz"
        },
        {
          "id": 392672377,
          "name": "glow_2.1.2_Openbsd_arm.tar.gz.sbom.json",
          "size": 97183,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_arm.tar.gz.sbom.json"
        },
        {
          "id": 392672342,
          "name": "glow_2.1.2_Openbsd_arm64.tar.gz",
          "size": 5925462,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_arm64.tar.gz"
        },
        {
          "id": 392672391,
          "name": "glow_2.1.2_Openbsd_arm64.tar.gz.sbom.json",
          "size": 97563,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 392672284,
          "name": "glow_2.1.2_Openbsd_i386.tar.gz",
          "size": 6195785,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_i386.tar.gz"
        },
        {
          "id": 392672376,
          "name": "glow_2.1.2_Openbsd_i386.tar.gz.sbom.json",
          "size": 97373,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 392672341,
          "name": "glow_2.1.2_Openbsd_x86_64.tar.gz",
          "size": 6559540,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_x86_64.tar.gz"
        },
        {
          "id": 392672390,
          "name": "glow_2.1.2_Openbsd_x86_64.tar.gz.sbom.json",
          "size": 97753,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Openbsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 392672280,
          "name": "glow_2.1.2_Windows_i386.zip",
          "size": 6550330,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Windows_i386.zip"
        },
        {
          "id": 392672374,
          "name": "glow_2.1.2_Windows_i386.zip.sbom.json",
          "size": 103523,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Windows_i386.zip.sbom.json"
        },
        {
          "id": 392672345,
          "name": "glow_2.1.2_Windows_x86_64.zip",
          "size": 6787071,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Windows_x86_64.zip"
        },
        {
          "id": 392672388,
          "name": "glow_2.1.2_Windows_x86_64.zip.sbom.json",
          "size": 103927,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_Windows_x86_64.zip.sbom.json"
        },
        {
          "id": 392672343,
          "name": "glow_2.1.2_x86.apk",
          "size": 6491744,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_x86.apk"
        },
        {
          "id": 392672344,
          "name": "glow_2.1.2_x86_64.apk",
          "size": 6877146,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/glow/releases/download/v2.1.2/glow_2.1.2_x86_64.apk"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "glow": "glow_2.1.2_Linux_x86_64.tar.gz"
      },
      "linux-arm64": {
        "glow": "glow_2.1.2_Linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "glow": "glow_2.1.2_Darwin_x86_64.tar.gz"
      },
      "darwin-arm64": {
        "glow": "glow_2.1.2_Darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "charmbracelet/gum",
      "version": "v0.17.0"
    },
    "release": {
      "tag_name": "v0.17.0",
      "assets": [
        {
          "id": 290081052,
          "name": "checksums.txt",
          "size": 6400,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/checksums.txt"
        },
        {
          "id": 290081055,
          "name": "checksums.txt.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/checksums.txt.pem"
        },
        {
          "id": 290081053,
          "name": "checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/checksums.txt.sig"
        },
        {
          "id": 290081002,
          "name": "gum-0.17.0-1.aarch64.rpm",
          "size": 4433381,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0-1.aarch64.rpm"
        },
        {
          "id": 290080990,
          "name": "gum-0.17.0-1.armv6hl.rpm",
          "size": 4673638,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0-1.armv6hl.rpm"
        },
        {
          "id": 290081003,
          "name": "gum-0.17.0-1.armv7hl.rpm",
          "size": 4651199,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0-1.armv7hl.rpm"
        },
        {
          "id": 290080994,
          "name": "gum-0.17.0-1.i386.rpm",
          "size": 4520465,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0-1.i386.rpm"
        },
        {
          "id": 290080997,
          "name": "gum-0.17.0-1.x86_64.rpm",
          "size": 4921168,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0-1.x86_64.rpm"
        },
        {
          "id": 290080971,
          "name": "gum-0.17.0.tar.gz",
          "size": 72575,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0.tar.gz"
        },
        {
          "id": 290081008,
          "name": "gum-0.17.0.tar.gz.sbom.json",
          "size": 81009,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum-0.17.0.tar.gz.sbom.json"
        },
        {
          "id": 290080972,
          "name": "gum_0.17.0_aarch64.apk",
          "size": 4431889,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_aarch64.apk"
        },
        {
          "id": 290080988,
          "name": "gum_0.17.0_amd64.deb",
          "size": 4697292,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_amd64.deb"
        },
        {
          "id": 290080984,
          "name": "gum_0.17.0_arm64.deb",
          "size": 4260486,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_arm64.deb"
        },
        {
          "id": 290080974,
          "name": "gum_0.17.0_armhf.apk",
          "size": 4699866,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_armhf.apk"
        },
        {
          "id": 290081001,
          "name": "gum_0.17.0_armhf.deb",
          "size": 4482096,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_armhf.deb"
        },
        {
          "id": 290080987,
          "name": "gum_0.17.0_armhf6.deb",
          "size": 4498988,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_armhf6.deb"
        },
        {
          "id": 290080977,
          "name": "gum_0.17.0_armv7.apk",
          "size": 4663417,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_armv7.apk"
        },
        {
          "id": 290080948,
          "name": "gum_0.17.0_Darwin_arm64.tar.gz",
          "size": 4395909,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Darwin_arm64.tar.gz"
        },
        {
          "id": 290081030,
          "name": "gum_0.17.0_Darwin_arm64.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 290080970,
          "name": "gum_0.17.0_Darwin_x86_64.tar.gz",
          "size": 4828902,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Darwin_x86_64.tar.gz"
        },
        {
          "id": 290081051,
          "name": "gum_0.17.0_Darwin_x86_64.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Darwin_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 290080950,
          "name": "gum_0.17.0_Freebsd_arm64.tar.gz",
          "size": 4212071,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_arm64.tar.gz"
        },
        {
          "id": 290081032,
          "name": "gum_0.17.0_Freebsd_arm64.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 290080932,
          "name": "gum_0.17.0_Freebsd_armv6.tar.gz",
          "size": 4453206,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_armv6.tar.gz"
        },
        {
          "id": 290081021,
          "name": "gum_0.17.0_Freebsd_armv6.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_armv6.tar.gz.sbom.json"
        },
        {
          "id": 290080923,
          "name": "gum_0.17.0_Freebsd_armv7.tar.gz",
          "size": 4433612,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_armv7.tar.gz"
        },
        {
          "id": 290081005,
          "name": "gum_0.17.0_Freebsd_armv7.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_armv7.tar.gz.sbom.json"
        },
        {
          "id": 290080921,
          "name": "gum_0.17.0_Freebsd_i386.tar.gz",
          "size": 4276485,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_i386.tar.gz"
        },
        {
          "id": 290081010,
          "name": "gum_0.17.0_Freebsd_i386.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 290080937,
          "name": "gum_0.17.0_Freebsd_x86_64.tar.gz",
          "size": 4643100,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_x86_64.tar.gz"
        },
        {
          "id": 290081023,
          "name": "gum_0.17.0_Freebsd_x86_64.tar.gz.sbom.json",
          "size": 78532,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Freebsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 290080986,
          "name": "gum_0.17.0_i386.deb",
          "size": 4322458,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_i386.deb"
        },
        {
          "id": 290080957,
          "name": "gum_0.17.0_Linux_arm64.tar.gz",
          "size": 4249159,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_arm64.tar.gz"
        },
        {
          "id": 290081039,
          "name": "gum_0.17.0_Linux_arm64.tar.gz.sbom.json",
          "size": 78070,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 290080929,
          "name": "gum_0.17.0_Linux_armv6.tar.gz",
          "size": 4486084,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_armv6.tar.gz"
        },
        {
          "id": 290081019,
          "name": "gum_0.17.0_Linux_armv6.tar.gz.sbom.json",
          "size": 78070,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_armv6.tar.gz.sbom.json"
        },
        {
          "id": 290080955,
          "name": "gum_0.17.0_Linux_armv7.tar.gz",
          "size": 4467109,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_armv7.tar.gz"
        },
        {
          "id": 290081037,
          "name": "gum_0.17.0_Linux_armv7.tar.gz.sbom.json",
          "size": 78070,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_armv7.tar.gz.sbom.json"
        },
        {
          "id": 290080968,
          "name": "gum_0.17.0_Linux_i386.tar.gz",
          "size": 4313377,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_i386.tar.gz"
        },
        {
          "id": 290081048,
          "name": "gum_0.17.0_Linux_i386.tar.gz.sbom.json",
          "size": 77916,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_i386.tar.gz.sbom.json"
        },
        {
          "id": 290080949,
          "name": "gum_0.17.0_Linux_x86_64.tar.gz",
          "size": 4681855,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_x86_64.tar.gz"
        },
        {
          "id": 290081033,
          "name": "gum_0.17.0_Linux_x86_64.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Linux_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 290080964,
          "name": "gum_0.17.0_Netbsd_arm64.tar.gz",
          "size": 4207347,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_arm64.tar.gz"
        },
        {
          "id": 290081044,
          "name": "gum_0.17.0_Netbsd_arm64.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 290080938,
          "name": "gum_0.17.0_Netbsd_armv6.tar.gz",
          "size": 4443161,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_armv6.tar.gz"
        },
        {
          "id": 290081027,
          "name": "gum_0.17.0_Netbsd_armv6.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_armv6.tar.gz.sbom.json"
        },
        {
          "id": 290080967,
          "name": "gum_0.17.0_Netbsd_armv7.tar.gz",
          "size": 4424589,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_armv7.tar.gz"
        },
        {
          "id": 290081047,
          "name": "gum_0.17.0_Netbsd_armv7.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_armv7.tar.gz.sbom.json"
        },
        {
          "id": 290080952,
          "name": "gum_0.17.0_Netbsd_i386.tar.gz",
          "size": 4263672,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_i386.tar.gz"
        },
        {
          "id": 290081036,
          "name": "gum_0.17.0_Netbsd_i386.tar.gz.sbom.json",
          "size": 78070,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 290080940,
          "name": "gum_0.17.0_Netbsd_x86_64.tar.gz",
          "size": 4637959,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_x86_64.tar.gz"
        },
        {
          "id": 290081028,
          "name": "gum_0.17.0_Netbsd_x86_64.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Netbsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 290080958,
          "name": "gum_0.17.0_Openbsd_arm64.tar.gz",
          "size": 4211521,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_arm64.tar.gz"
        },
        {
          "id": 290081041,
          "name": "gum_0.17.0_Openbsd_arm64.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 290080928,
          "name": "gum_0.17.0_Openbsd_armv6.tar.gz",
          "size": 4448914,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_armv6.tar.gz"
        },
        {
          "id": 290081017,
          "name": "gum_0.17.0_Openbsd_armv6.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_armv6.tar.gz.sbom.json"
        },
        {
          "id": 290080960,
          "name": "gum_0.17.0_Openbsd_armv7.tar.gz",
          "size": 4429619,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_armv7.tar.gz"
        },
        {
          "id": 290081042,
          "name": "gum_0.17.0_Openbsd_armv7.tar.gz.sbom.json",
          "size": 78378,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_armv7.tar.gz.sbom.json"
        },
        {
          "id": 290080939,
          "name": "gum_0.17.0_Openbsd_i386.tar.gz",
          "size": 4271717,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_i386.tar.gz"
        },
        {
          "id": 290081029,
          "name": "gum_0.17.0_Openbsd_i386.tar.gz.sbom.json",
          "size": 78224,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 290080920,
          "name": "gum_0.17.0_Openbsd_x86_64.tar.gz",
          "size": 4640083,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_x86_64.tar.gz"
        },
        {
          "id": 290081015,
          "name": "gum_0.17.0_Openbsd_x86_64.tar.gz.sbom.json",
          "size": 78532,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Openbsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 290080930,
          "name": "gum_0.17.0_Windows_i386.zip",
          "size": 4574956,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Windows_i386.zip"
        },
        {
          "id": 290081020,
          "name": "gum_0.17.0_Windows_i386.zip.sbom.json",
          "size": 82789,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Windows_i386.zip.sbom.json"
        },
        {
          "id": 290080922,
          "name": "gum_0.17.0_Windows_x86_64.zip",
          "size": 4836357,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Windows_x86_64.zip"
        },
        {
          "id": 290081014,
          "name": "gum_0.17.0_Windows_x86_64.zip.sbom.json",
          "size": 83115,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_Windows_x86_64.zip.sbom.json"
        },
        {
          "id": 290080976,
          "name": "gum_0.17.0_x86.apk",
          "size": 4508311,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_x86.apk"
        },
        {
          "id": 290080979,
          "name": "gum_0.17.0_x86_64.apk",
          "size": 4899420,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/gum/releases/download/v0.17.0/gum_0.17.0_x86_64.apk"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "gum": "gum_0.17.0_Linux_x86_64.tar.gz"
      },
      "linux-arm64": {
        "gum": "gum_0.17.0_Linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "gum": "gum_0.17.0_Darwin_x86_64.tar.gz"
      },
      "darwin-arm64": {
        "gum": "gum_0.17.0_Darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "charmbracelet/mods"
    },
    "release": {
      "tag_name": "v1.8.1",
      "assets": [
        {
          "id": 271757251,
          "name": "checksums.txt",
          "size": 3264,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/checksums.txt"
        },
        {
          "id": 271757252,
          "name": "checksums.txt.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/checksums.txt.pem"
        },
        {
          "id": 271757250,
          "name": "checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/checksums.txt.sig"
        },
        {
          "id": 271757233,
          "name": "mods-1.8.1-1.aarch64.rpm",
          "size": 10382703,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1-1.aarch64.rpm"
        },
        {
          "id": 271757237,
          "name": "mods-1.8.1-1.armv7hl.rpm",
          "size": 10475491,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1-1.armv7hl.rpm"
        },
        {
          "id": 271757232,
          "name": "mods-1.8.1-1.i386.rpm",
          "size": 10454562,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1-1.i386.rpm"
        },
        {
          "id": 271757235,
          "name": "mods-1.8.1-1.x86_64.rpm",
          "size": 11199462,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1-1.x86_64.rpm"
        },
        {
          "id": 271757218,
          "name": "mods-1.8.1.tar.gz",
          "size": 67058,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1.tar.gz"
        },
        {
          "id": 271757238,
          "name": "mods-1.8.1.tar.gz.sbom.json",
          "size": 120000,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods-1.8.1.tar.gz.sbom.json"
        },
        {
          "id": 271757224,
          "name": "mods_1.8.1_aarch64.apk",
          "size": 10354872,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_aarch64.apk"
        },
        {
          "id": 271757230,
          "name": "mods_1.8.1_amd64.deb",
          "size": 10749598,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_amd64.deb"
        },
        {
          "id": 271757225,
          "name": "mods_1.8.1_arm64.deb",
          "size": 10000720,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_arm64.deb"
        },
        {
          "id": 271757228,
          "name": "mods_1.8.1_armhf.deb",
          "size": 10086378,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_armhf.deb"
        },
        {
          "id": 271757219,
          "name": "mods_1.8.1_armv7.apk",
          "size": 10479661,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_armv7.apk"
        },
        {
          "id": 271757208,
          "name": "mods_1.8.1_Darwin_arm64.tar.gz",
          "size": 10453962,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Darwin_arm64.tar.gz"
        },
        {
          "id": 271757240,
          "name": "mods_1.8.1_Darwin_arm64.tar.gz.sbom.json",
          "size": 123931,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 271757217,
          "name": "mods_1.8.1_Darwin_x86_64.tar.gz",
          "size": 11214035,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Darwin_x86_64.tar.gz"
        },
        {
          "id": 271757249,
          "name": "mods_1.8.1_Darwin_x86_64.tar.gz.sbom.json",
          "size": 124172,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Darwin_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 271757213,
          "name": "mods_1.8.1_Freebsd_arm64.tar.gz",
          "size": 9953615,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Freebsd_arm64.tar.gz"
        },
        {
          "id": 271757246,
          "name": "mods_1.8.1_Freebsd_arm64.tar.gz.sbom.json",
          "size": 124172,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Freebsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 271757214,
          "name": "mods_1.8.1_Freebsd_x86_64.tar.gz",
          "size": 10703216,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Freebsd_x86_64.tar.gz"
        },
        {
          "id": 271757247,
          "name": "mods_1.8.1_Freebsd_x86_64.tar.gz.sbom.json",
          "size": 124413,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Freebsd_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 271757226,
          "name": "mods_1.8.1_i386.deb",
          "size": 10017416,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_i386.deb"
        },
        {
          "id": 271757215,
          "name": "mods_1.8.1_Linux_arm.tar.gz",
          "size": 10053265,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_arm.tar.gz"
        },
        {
          "id": 271757248,
          "name": "mods_1.8.1_Linux_arm.tar.gz.sbom.json",
          "size": 121543,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_arm.tar.gz.sbom.json"
        },
        {
          "id": 271757205,
          "name": "mods_1.8.1_Linux_arm64.tar.gz",
          "size": 9959537,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_arm64.tar.gz"
        },
        {
          "id": 271757241,
          "name": "mods_1.8.1_Linux_arm64.tar.gz.sbom.json",
          "size": 122019,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 271757206,
          "name": "mods_1.8.1_Linux_i386.tar.gz",
          "size": 9984766,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_i386.tar.gz"
        },
        {
          "id": 271757239,
          "name": "mods_1.8.1_Linux_i386.tar.gz.sbom.json",
          "size": 121781,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_i386.tar.gz.sbom.json"
        },
        {
          "id": 271757207,
          "name": "mods_1.8.1_Linux_x86_64.tar.gz",
          "size": 10710072,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_x86_64.tar.gz"
        },
        {
          "id": 271757243,
          "name": "mods_1.8.1_Linux_x86_64.tar.gz.sbom.json",
          "size": 122257,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Linux_x86_64.tar.gz.sbom.json"
        },
        {
          "id": 271757212,
          "name": "mods_1.8.1_Windows_arm64.zip",
          "size": 10044979,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Windows_arm64.zip"
        },
        {
          "id": 271757245,
          "name": "mods_1.8.1_Windows_arm64.zip.sbom.json",
          "size": 130419,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Windows_arm64.zip.sbom.json"
        },
        {
          "id": 271757211,
          "name": "mods_1.8.1_Windows_x86_64.zip",
          "size": 10994921,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Windows_x86_64.zip"
        },
        {
          "id": 271757244,
          "name": "mods_1.8.1_Windows_x86_64.zip.sbom.json",
          "size": 130672,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_Windows_x86_64.zip.sbom.json"
        },
        {
          "id": 271757220,
          "name": "mods_1.8.1_x86.apk",
          "size": 10418109,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_x86.apk"
        },
        {
          "id": 271757223,
          "name": "mods_1.8.1_x86_64.apk",
          "size": 11165010,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/charmbracelet/mods/releases/download/v1.8.1/mods_1.8.1_x86_64.apk"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "mods": "mods_1.8.1_Linux_x86_64.tar.gz"
      },
      "linux-arm64": {
        "mods": "mods_1.8.1_Linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "mods": "mods_1.8.1_Darwin_x86_64.tar.gz"
      },
      "darwin-arm64": {
        "mods": "mods_1.8.1_Darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "chmln/sd",
      "version": "v1.1.0"
    },
    "release": {
      "tag_name": "v1.1.0",
      "assets": [
        {
          "id": 362325451,
          "name": "sd-v1.1.0-aarch64-apple-darwin.tar.gz",
          "size": 852694,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 362325535,
          "name": "sd-v1.1.0-aarch64-unknown-linux-musl.tar.gz",
          "size": 924956,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 362325453,
          "name": "sd-v1.1.0-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 896137,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 362325450,
          "name": "sd-v1.1.0-armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 884126,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 362325430,
          "name": "sd-v1.1.0-x86_64-apple-darwin.tar.gz",
          "size": 927982,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 362326095,
          "name": "sd-v1.1.0-x86_64-pc-windows-gnu.zip",
          "size": 915261,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-x86_64-pc-windows-gnu.zip"
        },
        {
          "id": 362325573,
          "name": "sd-v1.1.0-x86_64-pc-windows-msvc.zip",
          "size": 888027,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 362325296,
          "name": "sd-v1.1.0-x86_64-unknown-linux-gnu.tar.gz",
          "size": 988815,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 362325321,
          "name": "sd-v1.1.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 1049511,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/chmln/sd/releases/download/v1.1.0/sd-v1.1.0-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "sd": "sd-v1.1.0-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "sd": "sd-v1.1.0-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "sd": "sd-v1.1.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "sd": "sd-v1.1.0-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "chronologos/lightjj"
    },
    "release": {
      "tag_name": "v1.33.0",
      "assets": [
        {
          "id": 451558328,
          "name": "checksums.sha256",
          "size": 352,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/chronologos/lightjj/releases/download/v1.33.0/checksums.sha256"
        },
        {
          "id": 451558332,
          "name": "lightjj-linux-arm64",
          "size": 10485944,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/chronologos/lightjj/releases/download/v1.33.0/lightjj-linux-arm64"
        },
        {
          "id": 451558330,
          "name": "lightjj-linux-x86_64",
          "size": 10879160,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/chronologos/lightjj/releases/download/v1.33.0/lightjj-linux-x86_64"
        },
        {
          "id": 451558329,
          "name": "lightjj-macos-arm64",
          "size": 10559858,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/chronologos/lightjj/releases/download/v1.33.0/lightjj-macos-arm64"
        },
        {
          "id": 451558331,
          "name": "lightjj-windows-x86_64.exe",
          "size": 11197952,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/chronologos/lightjj/releases/download/v1.33.0/lightjj-windows-x86_64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "lightjj": "lightjj-linux-x86_64"
      },
      "linux-arm64": {
        "lightjj": "lightjj-linux-arm64"
      },
      "darwin-x64": {
        "lightjj": null
      },
      "darwin-arm64": {
        "lightjj": "lightjj-macos-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "ClementTsang/bottom",
      "version": "0.14.0",
      "assetHints": {
        "select": "x86_64-unknown-linux-musl.tar.gz"
      }
    },
    "release": {
      "tag_name": "0.14.0",
      "assets": [
        {
          "id": 452886982,
          "name": "bottom-0.14.0-1.x86_64.rpm",
          "size": 1635136,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom-0.14.0-1.x86_64.rpm"
        },
        {
          "id": 452886981,
          "name": "bottom-musl-0.14.0-1.x86_64.rpm",
          "size": 1700866,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom-musl-0.14.0-1.x86_64.rpm"
        },
        {
          "id": 452886980,
          "name": "bottom-musl_0.14.0-1_amd64.deb",
          "size": 1556852,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom-musl_0.14.0-1_amd64.deb"
        },
        {
          "id": 452886975,
          "name": "bottom-musl_0.14.0-1_arm64.deb",
          "size": 1314344,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom-musl_0.14.0-1_arm64.deb"
        },
        {
          "id": 452886979,
          "name": "bottom-musl_0.14.0-1_armhf.deb",
          "size": 1363404,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom-musl_0.14.0-1_armhf.deb"
        },
        {
          "id": 452886976,
          "name": "bottom.desktop",
          "size": 281,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom.desktop"
        },
        {
          "id": 452886977,
          "name": "bottom_0.14.0-1_amd64.deb",
          "size": 1500168,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_0.14.0-1_amd64.deb"
        },
        {
          "id": 452886974,
          "name": "bottom_0.14.0-1_arm64.deb",
          "size": 1286104,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_0.14.0-1_arm64.deb"
        },
        {
          "id": 452886978,
          "name": "bottom_0.14.0-1_armhf.deb",
          "size": 1330632,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_0.14.0-1_armhf.deb"
        },
        {
          "id": 452886971,
          "name": "bottom_aarch64-apple-darwin.tar.gz",
          "size": 1740102,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 452886972,
          "name": "bottom_aarch64-linux-android.tar.gz",
          "size": 1730090,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64-linux-android.tar.gz"
        },
        {
          "id": 452886964,
          "name": "bottom_aarch64-pc-windows-msvc.zip",
          "size": 1708967,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 452886970,
          "name": "bottom_aarch64-unknown-linux-gnu.tar.gz",
          "size": 1890908,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886965,
          "name": "bottom_aarch64-unknown-linux-musl.tar.gz",
          "size": 1912826,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452886969,
          "name": "bottom_aarch64_installer.msi",
          "size": 2027520,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_aarch64_installer.msi"
        },
        {
          "id": 452886968,
          "name": "bottom_armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 1939957,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 452886963,
          "name": "bottom_armv7-unknown-linux-musleabihf.tar.gz",
          "size": 1966322,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 452886961,
          "name": "bottom_i686-pc-windows-msvc.zip",
          "size": 1756702,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_i686-pc-windows-msvc.zip"
        },
        {
          "id": 452886973,
          "name": "bottom_i686-unknown-linux-gnu.tar.gz",
          "size": 2063720,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886966,
          "name": "bottom_i686-unknown-linux-musl.tar.gz",
          "size": 2042720,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452886967,
          "name": "bottom_loongarch64-unknown-linux-gnu.tar.gz",
          "size": 1953042,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_loongarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886962,
          "name": "bottom_powerpc64le-unknown-linux-gnu.tar.gz",
          "size": 2171529,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_powerpc64le-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886959,
          "name": "bottom_riscv64gc-unknown-linux-gnu.tar.gz",
          "size": 2006267,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_riscv64gc-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886954,
          "name": "bottom_x86_64-apple-darwin.tar.gz",
          "size": 1889023,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 452886957,
          "name": "bottom_x86_64-pc-windows-gnu.zip",
          "size": 1793591,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-pc-windows-gnu.zip"
        },
        {
          "id": 452886958,
          "name": "bottom_x86_64-pc-windows-msvc.zip",
          "size": 1914340,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 452886955,
          "name": "bottom_x86_64-unknown-freebsd.tar.gz",
          "size": 2011354,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-unknown-freebsd.tar.gz"
        },
        {
          "id": 452886953,
          "name": "bottom_x86_64-unknown-linux-gnu-2-17.tar.gz",
          "size": 2054283,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-unknown-linux-gnu-2-17.tar.gz"
        },
        {
          "id": 452886960,
          "name": "bottom_x86_64-unknown-linux-gnu.tar.gz",
          "size": 2049110,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 452886956,
          "name": "bottom_x86_64-unknown-linux-musl.tar.gz",
          "size": 2116830,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 452886952,
          "name": "bottom_x86_64-unknown-netbsd.tar.gz",
          "size": 1973962,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64-unknown-netbsd.tar.gz"
        },
        {
          "id": 452886951,
          "name": "bottom_x86_64_installer.msi",
          "size": 2240512,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/bottom_x86_64_installer.msi"
        },
        {
          "id": 452886950,
          "name": "choco.zip",
          "size": 2450,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/choco.zip"
        },
        {
          "id": 452886948,
          "name": "completion.tar.gz",
          "size": 7810,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/completion.tar.gz"
        },
        {
          "id": 452886949,
          "name": "manpage.tar.gz",
          "size": 3667,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/ClementTsang/bottom/releases/download/0.14.0/manpage.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "btm": "bottom_x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "btm": "bottom_aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "btm": "bottom_x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "btm": "bottom_aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "dandavison/delta",
      "version": "0.19.2"
    },
    "release": {
      "tag_name": "0.19.2",
      "assets": [
        {
          "id": 383662310,
          "name": "delta-0.19.2-aarch64-apple-darwin.tar.gz",
          "size": 3027429,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 383662337,
          "name": "delta-0.19.2-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3166854,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 383662316,
          "name": "delta-0.19.2-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 3148562,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 383662288,
          "name": "delta-0.19.2-i686-unknown-linux-gnu.tar.gz",
          "size": 3546950,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 383663165,
          "name": "delta-0.19.2-x86_64-pc-windows-msvc.zip",
          "size": 3427675,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 383662069,
          "name": "delta-0.19.2-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3337309,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 383662298,
          "name": "delta-0.19.2-x86_64-unknown-linux-musl.tar.gz",
          "size": 3403232,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/delta-0.19.2-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 383662299,
          "name": "git-delta-musl_0.19.2_amd64.deb",
          "size": 2682404,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/git-delta-musl_0.19.2_amd64.deb"
        },
        {
          "id": 383662070,
          "name": "git-delta_0.19.2_amd64.deb",
          "size": 2630452,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/git-delta_0.19.2_amd64.deb"
        },
        {
          "id": 383662336,
          "name": "git-delta_0.19.2_arm64.deb",
          "size": 2395752,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/git-delta_0.19.2_arm64.deb"
        },
        {
          "id": 383662315,
          "name": "git-delta_0.19.2_armhf.deb",
          "size": 2376700,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/git-delta_0.19.2_armhf.deb"
        },
        {
          "id": 383662287,
          "name": "git-delta_0.19.2_i386.deb",
          "size": 2806352,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/dandavison/delta/releases/download/0.19.2/git-delta_0.19.2_i386.deb"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "delta": "delta-0.19.2-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "delta": "delta-0.19.2-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "delta": null
      },
      "darwin-arm64": {
        "delta": "delta-0.19.2-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "denoland/deno",
      "version": "v2.8.3"
    },
    "release": {
      "tag_name": "v2.8.3",
      "assets": [
        {
          "id": 444721336,
          "name": "deno-aarch64-apple-darwin.from-2.8.2.bsdiff",
          "size": 8123331,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.from-2.8.2.bsdiff"
        },
        {
          "id": 444721334,
          "name": "deno-aarch64-apple-darwin.from-2.8.2.bsdiff.sha256sum",
          "size": 110,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444721333,
          "name": "deno-aarch64-apple-darwin.sha256sum",
          "size": 71,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.sha256sum"
        },
        {
          "id": 444721337,
          "name": "deno-aarch64-apple-darwin.zip",
          "size": 38084039,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.zip"
        },
        {
          "id": 444721339,
          "name": "deno-aarch64-apple-darwin.zip.sha256sum",
          "size": 96,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-apple-darwin.zip.sha256sum"
        },
        {
          "id": 444725203,
          "name": "deno-aarch64-pc-windows-msvc.from-2.8.2.bsdiff",
          "size": 6293842,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-pc-windows-msvc.from-2.8.2.bsdiff"
        },
        {
          "id": 444725200,
          "name": "deno-aarch64-pc-windows-msvc.from-2.8.2.bsdiff.sha256sum",
          "size": 192,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-pc-windows-msvc.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444725205,
          "name": "deno-aarch64-pc-windows-msvc.sha256sum",
          "size": 154,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-pc-windows-msvc.sha256sum"
        },
        {
          "id": 444725199,
          "name": "deno-aarch64-pc-windows-msvc.zip",
          "size": 39589855,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 444725201,
          "name": "deno-aarch64-pc-windows-msvc.zip.sha256sum",
          "size": 178,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-pc-windows-msvc.zip.sha256sum"
        },
        {
          "id": 444708424,
          "name": "deno-aarch64-unknown-linux-gnu.from-2.8.2.bsdiff",
          "size": 8824700,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-unknown-linux-gnu.from-2.8.2.bsdiff"
        },
        {
          "id": 444708428,
          "name": "deno-aarch64-unknown-linux-gnu.from-2.8.2.bsdiff.sha256sum",
          "size": 115,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-unknown-linux-gnu.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444708423,
          "name": "deno-aarch64-unknown-linux-gnu.sha256sum",
          "size": 71,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-unknown-linux-gnu.sha256sum"
        },
        {
          "id": 444708427,
          "name": "deno-aarch64-unknown-linux-gnu.zip",
          "size": 42042289,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-unknown-linux-gnu.zip"
        },
        {
          "id": 444708421,
          "name": "deno-aarch64-unknown-linux-gnu.zip.sha256sum",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-aarch64-unknown-linux-gnu.zip.sha256sum"
        },
        {
          "id": 444739749,
          "name": "deno-x86_64-apple-darwin.from-2.8.2.bsdiff",
          "size": 7078953,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-apple-darwin.from-2.8.2.bsdiff"
        },
        {
          "id": 444739750,
          "name": "deno-x86_64-apple-darwin.from-2.8.2.bsdiff.sha256sum",
          "size": 109,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-apple-darwin.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444739748,
          "name": "deno-x86_64-apple-darwin.sha256sum",
          "size": 71,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-apple-darwin.sha256sum"
        },
        {
          "id": 444739746,
          "name": "deno-x86_64-apple-darwin.zip",
          "size": 42312633,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-apple-darwin.zip"
        },
        {
          "id": 444739745,
          "name": "deno-x86_64-apple-darwin.zip.sha256sum",
          "size": 95,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-apple-darwin.zip.sha256sum"
        },
        {
          "id": 444718358,
          "name": "deno-x86_64-pc-windows-msvc.from-2.8.2.bsdiff",
          "size": 6576650,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-pc-windows-msvc.from-2.8.2.bsdiff"
        },
        {
          "id": 444718357,
          "name": "deno-x86_64-pc-windows-msvc.from-2.8.2.bsdiff.sha256sum",
          "size": 191,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-pc-windows-msvc.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444718353,
          "name": "deno-x86_64-pc-windows-msvc.sha256sum",
          "size": 154,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-pc-windows-msvc.sha256sum"
        },
        {
          "id": 444718355,
          "name": "deno-x86_64-pc-windows-msvc.zip",
          "size": 41638373,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 444718359,
          "name": "deno-x86_64-pc-windows-msvc.zip.sha256sum",
          "size": 177,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-pc-windows-msvc.zip.sha256sum"
        },
        {
          "id": 444717066,
          "name": "deno-x86_64-unknown-linux-gnu.from-2.8.2.bsdiff",
          "size": 7183272,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-unknown-linux-gnu.from-2.8.2.bsdiff"
        },
        {
          "id": 444717062,
          "name": "deno-x86_64-unknown-linux-gnu.from-2.8.2.bsdiff.sha256sum",
          "size": 114,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-unknown-linux-gnu.from-2.8.2.bsdiff.sha256sum"
        },
        {
          "id": 444717064,
          "name": "deno-x86_64-unknown-linux-gnu.sha256sum",
          "size": 71,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-unknown-linux-gnu.sha256sum"
        },
        {
          "id": 444717063,
          "name": "deno-x86_64-unknown-linux-gnu.zip",
          "size": 43810239,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-unknown-linux-gnu.zip"
        },
        {
          "id": 444717061,
          "name": "deno-x86_64-unknown-linux-gnu.zip.sha256sum",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno-x86_64-unknown-linux-gnu.zip.sha256sum"
        },
        {
          "id": 444721335,
          "name": "denort-aarch64-apple-darwin.zip",
          "size": 29886707,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-apple-darwin.zip"
        },
        {
          "id": 444721332,
          "name": "denort-aarch64-apple-darwin.zip.sha256sum",
          "size": 98,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-apple-darwin.zip.sha256sum"
        },
        {
          "id": 444725202,
          "name": "denort-aarch64-pc-windows-msvc.zip",
          "size": 31106772,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 444725204,
          "name": "denort-aarch64-pc-windows-msvc.zip.sha256sum",
          "size": 180,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-pc-windows-msvc.zip.sha256sum"
        },
        {
          "id": 444708422,
          "name": "denort-aarch64-unknown-linux-gnu.zip",
          "size": 32836040,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-unknown-linux-gnu.zip"
        },
        {
          "id": 444708425,
          "name": "denort-aarch64-unknown-linux-gnu.zip.sha256sum",
          "size": 103,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-aarch64-unknown-linux-gnu.zip.sha256sum"
        },
        {
          "id": 444739751,
          "name": "denort-x86_64-apple-darwin.zip",
          "size": 32558990,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-apple-darwin.zip"
        },
        {
          "id": 444739747,
          "name": "denort-x86_64-apple-darwin.zip.sha256sum",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-apple-darwin.zip.sha256sum"
        },
        {
          "id": 444718354,
          "name": "denort-x86_64-pc-windows-msvc.zip",
          "size": 32778458,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 444718356,
          "name": "denort-x86_64-pc-windows-msvc.zip.sha256sum",
          "size": 179,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-pc-windows-msvc.zip.sha256sum"
        },
        {
          "id": 444717067,
          "name": "denort-x86_64-unknown-linux-gnu.zip",
          "size": 34021349,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-unknown-linux-gnu.zip"
        },
        {
          "id": 444717060,
          "name": "denort-x86_64-unknown-linux-gnu.zip.sha256sum",
          "size": 102,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/denort-x86_64-unknown-linux-gnu.zip.sha256sum"
        },
        {
          "id": 444717065,
          "name": "deno_src.tar.gz",
          "size": 31358572,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/deno_src.tar.gz"
        },
        {
          "id": 444717072,
          "name": "lib.deno.d.ts",
          "size": 698465,
          "content_type": "video/mp2t",
          "browser_download_url": "https://github.com/denoland/deno/releases/download/v2.8.3/lib.deno.d.ts"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "deno": "deno-x86_64-unknown-linux-gnu.zip"
      },
      "linux-arm64": {
        "deno": "deno-aarch64-unknown-linux-gnu.zip"
      },
      "darwin-x64": {
        "deno": "deno-x86_64-apple-darwin.zip"
      },
      "darwin-arm64": {
        "deno": "deno-aarch64-apple-darwin.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "derailed/k9s"
    },
    "release": {
      "tag_name": "v0.51.0",
      "assets": [
        {
          "id": 440227702,
          "name": "checksums.sha256",
          "size": 3370,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/checksums.sha256"
        },
        {
          "id": 440224322,
          "name": "k9s_Darwin_amd64.tar.gz",
          "size": 42172258,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Darwin_amd64.tar.gz"
        },
        {
          "id": 440227677,
          "name": "k9s_Darwin_amd64.tar.gz.sbom.json",
          "size": 577502,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Darwin_amd64.tar.gz.sbom.json"
        },
        {
          "id": 440224326,
          "name": "k9s_Darwin_arm64.tar.gz",
          "size": 39201894,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Darwin_arm64.tar.gz"
        },
        {
          "id": 440227628,
          "name": "k9s_Darwin_arm64.tar.gz.sbom.json",
          "size": 577504,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 440224324,
          "name": "k9s_Freebsd_amd64.tar.gz",
          "size": 41274932,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Freebsd_amd64.tar.gz"
        },
        {
          "id": 440227661,
          "name": "k9s_Freebsd_amd64.tar.gz.sbom.json",
          "size": 577880,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Freebsd_amd64.tar.gz.sbom.json"
        },
        {
          "id": 440224329,
          "name": "k9s_Freebsd_arm64.tar.gz",
          "size": 37318410,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Freebsd_arm64.tar.gz"
        },
        {
          "id": 440227617,
          "name": "k9s_Freebsd_arm64.tar.gz.sbom.json",
          "size": 577880,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Freebsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 440227027,
          "name": "k9s_linux_amd64.apk",
          "size": 43263401,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_amd64.apk"
        },
        {
          "id": 440227403,
          "name": "k9s_linux_amd64.deb",
          "size": 41539644,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_amd64.deb"
        },
        {
          "id": 440226116,
          "name": "k9s_linux_amd64.rpm",
          "size": 43265311,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_amd64.rpm"
        },
        {
          "id": 440224321,
          "name": "k9s_Linux_amd64.tar.gz",
          "size": 41387759,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_amd64.tar.gz"
        },
        {
          "id": 440227653,
          "name": "k9s_Linux_amd64.tar.gz.sbom.json",
          "size": 575499,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_amd64.tar.gz.sbom.json"
        },
        {
          "id": 440226366,
          "name": "k9s_linux_arm.apk",
          "size": 40384004,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm.apk"
        },
        {
          "id": 440227346,
          "name": "k9s_linux_arm.deb",
          "size": 39025546,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm.deb"
        },
        {
          "id": 440226150,
          "name": "k9s_linux_arm.rpm",
          "size": 40390219,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm.rpm"
        },
        {
          "id": 440226268,
          "name": "k9s_linux_arm64.apk",
          "size": 38931082,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm64.apk"
        },
        {
          "id": 440227057,
          "name": "k9s_linux_arm64.deb",
          "size": 37561976,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm64.deb"
        },
        {
          "id": 440226044,
          "name": "k9s_linux_arm64.rpm",
          "size": 38844907,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_arm64.rpm"
        },
        {
          "id": 440226045,
          "name": "k9s_Linux_arm64.tar.gz",
          "size": 37438999,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_arm64.tar.gz"
        },
        {
          "id": 440227693,
          "name": "k9s_Linux_arm64.tar.gz.sbom.json",
          "size": 575499,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 440224320,
          "name": "k9s_Linux_armv7.tar.gz",
          "size": 38927578,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_armv7.tar.gz"
        },
        {
          "id": 440227538,
          "name": "k9s_Linux_armv7.tar.gz.sbom.json",
          "size": 574038,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_armv7.tar.gz.sbom.json"
        },
        {
          "id": 440226357,
          "name": "k9s_linux_ppc64le.apk",
          "size": 38794988,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_ppc64le.apk"
        },
        {
          "id": 440227080,
          "name": "k9s_linux_ppc64le.deb",
          "size": 37478094,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_ppc64le.deb"
        },
        {
          "id": 440226054,
          "name": "k9s_linux_ppc64le.rpm",
          "size": 38839413,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_ppc64le.rpm"
        },
        {
          "id": 440224319,
          "name": "k9s_Linux_ppc64le.tar.gz",
          "size": 37329473,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_ppc64le.tar.gz"
        },
        {
          "id": 440227601,
          "name": "k9s_Linux_ppc64le.tar.gz.sbom.json",
          "size": 574784,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_ppc64le.tar.gz.sbom.json"
        },
        {
          "id": 440226279,
          "name": "k9s_linux_s390x.apk",
          "size": 42113494,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_s390x.apk"
        },
        {
          "id": 440227427,
          "name": "k9s_linux_s390x.deb",
          "size": 40064994,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_s390x.deb"
        },
        {
          "id": 440226100,
          "name": "k9s_linux_s390x.rpm",
          "size": 42076600,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_linux_s390x.rpm"
        },
        {
          "id": 440224325,
          "name": "k9s_Linux_s390x.tar.gz",
          "size": 39827123,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_s390x.tar.gz"
        },
        {
          "id": 440227680,
          "name": "k9s_Linux_s390x.tar.gz.sbom.json",
          "size": 574038,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Linux_s390x.tar.gz.sbom.json"
        },
        {
          "id": 440224317,
          "name": "k9s_Windows_amd64.zip",
          "size": 42330705,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Windows_amd64.zip"
        },
        {
          "id": 440227650,
          "name": "k9s_Windows_amd64.zip.sbom.json",
          "size": 590262,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Windows_amd64.zip.sbom.json"
        },
        {
          "id": 440224323,
          "name": "k9s_Windows_arm64.zip",
          "size": 37580994,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Windows_arm64.zip"
        },
        {
          "id": 440227577,
          "name": "k9s_Windows_arm64.zip.sbom.json",
          "size": 590262,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/derailed/k9s/releases/download/v0.51.0/k9s_Windows_arm64.zip.sbom.json"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "k9s": "k9s_Linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "k9s": "k9s_Linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "k9s": "k9s_Darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "k9s": "k9s_Darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "devspace-sh/devspace"
    },
    "release": {
      "tag_name": "v6.3.21",
      "assets": [
        {
          "id": 402781971,
          "name": "devspace-darwin-amd64",
          "size": 82428264,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-darwin-amd64"
        },
        {
          "id": 402781966,
          "name": "devspace-darwin-amd64.sha256",
          "size": 133,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-darwin-amd64.sha256"
        },
        {
          "id": 402781964,
          "name": "devspace-darwin-arm64",
          "size": 78969106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-darwin-arm64"
        },
        {
          "id": 402781972,
          "name": "devspace-darwin-arm64.sha256",
          "size": 133,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-darwin-arm64.sha256"
        },
        {
          "id": 402781968,
          "name": "devspace-linux-386",
          "size": 69357752,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-386"
        },
        {
          "id": 402781967,
          "name": "devspace-linux-386.sha256",
          "size": 130,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-386.sha256"
        },
        {
          "id": 402781965,
          "name": "devspace-linux-amd64",
          "size": 71782584,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-amd64"
        },
        {
          "id": 402781976,
          "name": "devspace-linux-amd64.sha256",
          "size": 132,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-amd64.sha256"
        },
        {
          "id": 402781975,
          "name": "devspace-linux-arm64",
          "size": 68223160,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-arm64"
        },
        {
          "id": 402781973,
          "name": "devspace-linux-arm64.sha256",
          "size": 132,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-linux-arm64.sha256"
        },
        {
          "id": 402781983,
          "name": "devspace-windows-386.exe",
          "size": 70956032,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-windows-386.exe"
        },
        {
          "id": 402781969,
          "name": "devspace-windows-386.exe.sha256",
          "size": 136,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-windows-386.exe.sha256"
        },
        {
          "id": 402781974,
          "name": "devspace-windows-amd64.exe",
          "size": 73413120,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-windows-amd64.exe"
        },
        {
          "id": 402781970,
          "name": "devspace-windows-amd64.exe.sha256",
          "size": 138,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspace-windows-amd64.exe.sha256"
        },
        {
          "id": 402781980,
          "name": "devspacehelper",
          "size": 22376632,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspacehelper"
        },
        {
          "id": 402781979,
          "name": "devspacehelper-arm64",
          "size": 21102776,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspacehelper-arm64"
        },
        {
          "id": 402781982,
          "name": "devspacehelper-arm64.sha256",
          "size": 132,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspacehelper-arm64.sha256"
        },
        {
          "id": 402781978,
          "name": "devspacehelper.sha256",
          "size": 126,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/devspacehelper.sha256"
        },
        {
          "id": 402781981,
          "name": "ui.tar.gz",
          "size": 616707,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/ui.tar.gz"
        },
        {
          "id": 402781977,
          "name": "ui.tar.gz.sha256",
          "size": 121,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/devspace-sh/devspace/releases/download/v6.3.21/ui.tar.gz.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "devspace": "devspace-linux-amd64"
      },
      "linux-arm64": {
        "devspace": "devspace-linux-arm64"
      },
      "darwin-x64": {
        "devspace": "devspace-darwin-amd64"
      },
      "darwin-arm64": {
        "devspace": "devspace-darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "dmtrKovalenko/fff",
      "binaries": [
        {
          "name": "fff-mcp"
        }
      ],
      "assetHints": {
        "select": "fff-mcp-x86_64-unknown-linux-musl"
      }
    },
    "release": {
      "tag_name": "0.9.6-nightly.797c045",
      "assets": [
        {
          "id": 451389860,
          "name": "aarch64-apple-darwin.dylib",
          "size": 5142032,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-apple-darwin.dylib"
        },
        {
          "id": 451389851,
          "name": "aarch64-apple-darwin.dylib.sha256",
          "size": 93,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-apple-darwin.dylib.sha256"
        },
        {
          "id": 451389863,
          "name": "aarch64-linux-android.so",
          "size": 6659824,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-linux-android.so"
        },
        {
          "id": 451389852,
          "name": "aarch64-linux-android.so.sha256",
          "size": 91,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-linux-android.so.sha256"
        },
        {
          "id": 451389880,
          "name": "aarch64-pc-windows-msvc.dll",
          "size": 5968896,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-pc-windows-msvc.dll"
        },
        {
          "id": 451389867,
          "name": "aarch64-pc-windows-msvc.dll.sha256",
          "size": 94,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-pc-windows-msvc.dll.sha256"
        },
        {
          "id": 451389866,
          "name": "aarch64-unknown-linux-gnu.so",
          "size": 5187344,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-unknown-linux-gnu.so"
        },
        {
          "id": 451389845,
          "name": "aarch64-unknown-linux-gnu.so.sha256",
          "size": 95,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-unknown-linux-gnu.so.sha256"
        },
        {
          "id": 451389853,
          "name": "aarch64-unknown-linux-musl.so",
          "size": 5180192,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-unknown-linux-musl.so"
        },
        {
          "id": 451389842,
          "name": "aarch64-unknown-linux-musl.so.sha256",
          "size": 96,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/aarch64-unknown-linux-musl.so.sha256"
        },
        {
          "id": 451389865,
          "name": "c-lib-aarch64-apple-darwin.dylib",
          "size": 4823120,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-apple-darwin.dylib"
        },
        {
          "id": 451389838,
          "name": "c-lib-aarch64-apple-darwin.dylib.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-apple-darwin.dylib.sha256"
        },
        {
          "id": 451389857,
          "name": "c-lib-aarch64-linux-android.so",
          "size": 6156400,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-linux-android.so"
        },
        {
          "id": 451389847,
          "name": "c-lib-aarch64-linux-android.so.sha256",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-linux-android.so.sha256"
        },
        {
          "id": 451389844,
          "name": "c-lib-aarch64-pc-windows-msvc.dll",
          "size": 5792256,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-pc-windows-msvc.dll"
        },
        {
          "id": 451389855,
          "name": "c-lib-aarch64-pc-windows-msvc.dll.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-pc-windows-msvc.dll.sha256"
        },
        {
          "id": 451389843,
          "name": "c-lib-aarch64-unknown-linux-gnu.so",
          "size": 4920608,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-unknown-linux-gnu.so"
        },
        {
          "id": 451389868,
          "name": "c-lib-aarch64-unknown-linux-gnu.so.sha256",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-unknown-linux-gnu.so.sha256"
        },
        {
          "id": 451389841,
          "name": "c-lib-aarch64-unknown-linux-musl.so",
          "size": 4918312,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-unknown-linux-musl.so"
        },
        {
          "id": 451389856,
          "name": "c-lib-aarch64-unknown-linux-musl.so.sha256",
          "size": 102,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-aarch64-unknown-linux-musl.so.sha256"
        },
        {
          "id": 451389861,
          "name": "c-lib-x86_64-apple-darwin.dylib",
          "size": 5207744,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-apple-darwin.dylib"
        },
        {
          "id": 451389858,
          "name": "c-lib-x86_64-apple-darwin.dylib.sha256",
          "size": 98,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-apple-darwin.dylib.sha256"
        },
        {
          "id": 451389839,
          "name": "c-lib-x86_64-pc-windows-msvc.dll",
          "size": 6488064,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-pc-windows-msvc.dll"
        },
        {
          "id": 451389835,
          "name": "c-lib-x86_64-pc-windows-msvc.dll.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-pc-windows-msvc.dll.sha256"
        },
        {
          "id": 451389874,
          "name": "c-lib-x86_64-unknown-linux-gnu.so",
          "size": 5578112,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-unknown-linux-gnu.so"
        },
        {
          "id": 451389825,
          "name": "c-lib-x86_64-unknown-linux-gnu.so.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-unknown-linux-gnu.so.sha256"
        },
        {
          "id": 451389849,
          "name": "c-lib-x86_64-unknown-linux-musl.so",
          "size": 5580472,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-unknown-linux-musl.so"
        },
        {
          "id": 451389828,
          "name": "c-lib-x86_64-unknown-linux-musl.so.sha256",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/c-lib-x86_64-unknown-linux-musl.so.sha256"
        },
        {
          "id": 451389840,
          "name": "fff-mcp-aarch64-apple-darwin",
          "size": 7137552,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-apple-darwin"
        },
        {
          "id": 451389836,
          "name": "fff-mcp-aarch64-apple-darwin.sha256",
          "size": 95,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-apple-darwin.sha256"
        },
        {
          "id": 451389848,
          "name": "fff-mcp-aarch64-pc-windows-msvc.exe",
          "size": 7954944,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 451389832,
          "name": "fff-mcp-aarch64-pc-windows-msvc.exe.sha256",
          "size": 102,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-pc-windows-msvc.exe.sha256"
        },
        {
          "id": 451389834,
          "name": "fff-mcp-aarch64-unknown-linux-gnu",
          "size": 6834368,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-unknown-linux-gnu"
        },
        {
          "id": 451389823,
          "name": "fff-mcp-aarch64-unknown-linux-gnu.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-unknown-linux-gnu.sha256"
        },
        {
          "id": 451389837,
          "name": "fff-mcp-aarch64-unknown-linux-musl",
          "size": 6887536,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-unknown-linux-musl"
        },
        {
          "id": 451389827,
          "name": "fff-mcp-aarch64-unknown-linux-musl.sha256",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-aarch64-unknown-linux-musl.sha256"
        },
        {
          "id": 451389822,
          "name": "fff-mcp-x86_64-apple-darwin",
          "size": 7698288,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-apple-darwin"
        },
        {
          "id": 451389821,
          "name": "fff-mcp-x86_64-apple-darwin.sha256",
          "size": 94,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-apple-darwin.sha256"
        },
        {
          "id": 451389850,
          "name": "fff-mcp-x86_64-pc-windows-msvc.exe",
          "size": 9098752,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 451389833,
          "name": "fff-mcp-x86_64-pc-windows-msvc.exe.sha256",
          "size": 101,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-pc-windows-msvc.exe.sha256"
        },
        {
          "id": 451389831,
          "name": "fff-mcp-x86_64-unknown-linux-gnu",
          "size": 7730096,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-unknown-linux-gnu"
        },
        {
          "id": 451389816,
          "name": "fff-mcp-x86_64-unknown-linux-gnu.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-unknown-linux-gnu.sha256"
        },
        {
          "id": 451389824,
          "name": "fff-mcp-x86_64-unknown-linux-musl",
          "size": 7782248,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-unknown-linux-musl"
        },
        {
          "id": 451389814,
          "name": "fff-mcp-x86_64-unknown-linux-musl.sha256",
          "size": 100,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff-mcp-x86_64-unknown-linux-musl.sha256"
        },
        {
          "id": 451389884,
          "name": "fff_search-0.9.5-cp310-abi3-macosx_10_12_x86_64.whl",
          "size": 2327280,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-macosx_10_12_x86_64.whl"
        },
        {
          "id": 451389869,
          "name": "fff_search-0.9.5-cp310-abi3-macosx_10_12_x86_64.whl.sha256",
          "size": 125,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-macosx_10_12_x86_64.whl.sha256"
        },
        {
          "id": 451389870,
          "name": "fff_search-0.9.5-cp310-abi3-macosx_11_0_arm64.whl",
          "size": 2196059,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-macosx_11_0_arm64.whl"
        },
        {
          "id": 451389872,
          "name": "fff_search-0.9.5-cp310-abi3-macosx_11_0_arm64.whl.sha256",
          "size": 123,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-macosx_11_0_arm64.whl.sha256"
        },
        {
          "id": 451389883,
          "name": "fff_search-0.9.5-cp310-abi3-manylinux_2_38_aarch64.whl",
          "size": 2661484,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-manylinux_2_38_aarch64.whl"
        },
        {
          "id": 451389873,
          "name": "fff_search-0.9.5-cp310-abi3-manylinux_2_38_aarch64.whl.sha256",
          "size": 128,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-manylinux_2_38_aarch64.whl.sha256"
        },
        {
          "id": 451389877,
          "name": "fff_search-0.9.5-cp310-abi3-manylinux_2_38_x86_64.whl",
          "size": 2709552,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-manylinux_2_38_x86_64.whl"
        },
        {
          "id": 451389864,
          "name": "fff_search-0.9.5-cp310-abi3-manylinux_2_38_x86_64.whl.sha256",
          "size": 127,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-manylinux_2_38_x86_64.whl.sha256"
        },
        {
          "id": 451389881,
          "name": "fff_search-0.9.5-cp310-abi3-win_amd64.whl",
          "size": 2847804,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-win_amd64.whl"
        },
        {
          "id": 451389862,
          "name": "fff_search-0.9.5-cp310-abi3-win_amd64.whl.sha256",
          "size": 115,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5-cp310-abi3-win_amd64.whl.sha256"
        },
        {
          "id": 451389879,
          "name": "fff_search-0.9.5.tar.gz",
          "size": 2093700,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5.tar.gz"
        },
        {
          "id": 451389859,
          "name": "fff_search-0.9.5.tar.gz.sha256",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/fff_search-0.9.5.tar.gz.sha256"
        },
        {
          "id": 451389819,
          "name": "x86_64-apple-darwin.dylib",
          "size": 5540944,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-apple-darwin.dylib"
        },
        {
          "id": 451389829,
          "name": "x86_64-apple-darwin.dylib.sha256",
          "size": 92,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-apple-darwin.dylib.sha256"
        },
        {
          "id": 451389826,
          "name": "x86_64-pc-windows-msvc.dll",
          "size": 6768640,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-pc-windows-msvc.dll"
        },
        {
          "id": 451389817,
          "name": "x86_64-pc-windows-msvc.dll.sha256",
          "size": 93,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-pc-windows-msvc.dll.sha256"
        },
        {
          "id": 451389830,
          "name": "x86_64-unknown-linux-gnu.so",
          "size": 5872576,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-unknown-linux-gnu.so"
        },
        {
          "id": 451389818,
          "name": "x86_64-unknown-linux-gnu.so.sha256",
          "size": 94,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-unknown-linux-gnu.so.sha256"
        },
        {
          "id": 451389820,
          "name": "x86_64-unknown-linux-musl.so",
          "size": 5867480,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-unknown-linux-musl.so"
        },
        {
          "id": 451389815,
          "name": "x86_64-unknown-linux-musl.so.sha256",
          "size": 95,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/dmtrKovalenko/fff/releases/download/0.9.6-nightly.797c045/x86_64-unknown-linux-musl.so.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "fff-mcp": "fff-mcp-x86_64-unknown-linux-musl"
      },
      "linux-arm64": {
        "fff-mcp": "fff-mcp-aarch64-unknown-linux-gnu"
      },
      "darwin-x64": {
        "fff-mcp": "fff-mcp-x86_64-apple-darwin"
      },
      "darwin-arm64": {
        "fff-mcp": "fff-mcp-aarch64-apple-darwin"
      }
    }
  },
  {
    "pkg": {
      "repo": "docker/docker-credential-helpers",
      "assetHints": {
        "select": "docker-credential-pass"
      }
    },
    "release": {
      "tag_name": "v0.9.8",
      "assets": [
        {
          "id": 442012071,
          "name": "checksums.txt",
          "size": 2038,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/checksums.txt"
        },
        {
          "id": 442012065,
          "name": "docker-credential-osxkeychain-v0.9.8.darwin-amd64",
          "size": 2597744,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-osxkeychain-v0.9.8.darwin-amd64"
        },
        {
          "id": 442012067,
          "name": "docker-credential-osxkeychain-v0.9.8.darwin-arm64",
          "size": 2439618,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-osxkeychain-v0.9.8.darwin-arm64"
        },
        {
          "id": 442012078,
          "name": "docker-credential-pass-v0.9.8.darwin-amd64",
          "size": 2332416,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.darwin-amd64"
        },
        {
          "id": 442012080,
          "name": "docker-credential-pass-v0.9.8.darwin-arm64",
          "size": 2231026,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.darwin-arm64"
        },
        {
          "id": 442012081,
          "name": "docker-credential-pass-v0.9.8.linux-amd64",
          "size": 2367650,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-amd64"
        },
        {
          "id": 442012075,
          "name": "docker-credential-pass-v0.9.8.linux-arm64",
          "size": 2293922,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-arm64"
        },
        {
          "id": 442012072,
          "name": "docker-credential-pass-v0.9.8.linux-armv6",
          "size": 2359458,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-armv6"
        },
        {
          "id": 442012070,
          "name": "docker-credential-pass-v0.9.8.linux-armv7",
          "size": 2359458,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-armv7"
        },
        {
          "id": 442012064,
          "name": "docker-credential-pass-v0.9.8.linux-ppc64le",
          "size": 2424994,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-ppc64le"
        },
        {
          "id": 442012068,
          "name": "docker-credential-pass-v0.9.8.linux-s390x",
          "size": 2490530,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-pass-v0.9.8.linux-s390x"
        },
        {
          "id": 442012076,
          "name": "docker-credential-secretservice-v0.9.8.linux-amd64",
          "size": 2051744,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-amd64"
        },
        {
          "id": 442012066,
          "name": "docker-credential-secretservice-v0.9.8.linux-arm64",
          "size": 1937608,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-arm64"
        },
        {
          "id": 442012079,
          "name": "docker-credential-secretservice-v0.9.8.linux-armv6",
          "size": 1941056,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-armv6"
        },
        {
          "id": 442012073,
          "name": "docker-credential-secretservice-v0.9.8.linux-armv7",
          "size": 1932688,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-armv7"
        },
        {
          "id": 442012063,
          "name": "docker-credential-secretservice-v0.9.8.linux-ppc64le",
          "size": 2035000,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-ppc64le"
        },
        {
          "id": 442012074,
          "name": "docker-credential-secretservice-v0.9.8.linux-s390x",
          "size": 2106544,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-secretservice-v0.9.8.linux-s390x"
        },
        {
          "id": 442012077,
          "name": "docker-credential-wincred-v0.9.8.windows-amd64.exe",
          "size": 2334720,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-wincred-v0.9.8.windows-amd64.exe"
        },
        {
          "id": 442012069,
          "name": "docker-credential-wincred-v0.9.8.windows-arm64.exe",
          "size": 2197504,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/docker/docker-credential-helpers/releases/download/v0.9.8/docker-credential-wincred-v0.9.8.windows-arm64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "docker-credential-pass": "docker-credential-pass-v0.9.8.linux-amd64"
      },
      "linux-arm64": {
        "docker-credential-pass": "docker-credential-pass-v0.9.8.linux-arm64"
      },
      "darwin-x64": {
        "docker-credential-pass": "docker-credential-pass-v0.9.8.darwin-amd64"
      },
      "darwin-arm64": {
        "docker-credential-pass": "docker-credential-pass-v0.9.8.darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "duckdb/duckdb",
      "version": "v1.5.4"
    },
    "release": {
      "tag_name": "v1.5.4",
      "assets": [
        {
          "id": 450136185,
          "name": "duckdb_cli-linux-amd64-musl.gz",
          "size": 22307188,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-amd64-musl.gz"
        },
        {
          "id": 450136212,
          "name": "duckdb_cli-linux-amd64-musl.zip",
          "size": 22445863,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-amd64-musl.zip"
        },
        {
          "id": 450136226,
          "name": "duckdb_cli-linux-amd64.gz",
          "size": 21123372,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-amd64.gz"
        },
        {
          "id": 450136242,
          "name": "duckdb_cli-linux-amd64.zip",
          "size": 21247976,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-amd64.zip"
        },
        {
          "id": 450136268,
          "name": "duckdb_cli-linux-arm64-musl.gz",
          "size": 20499677,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-arm64-musl.gz"
        },
        {
          "id": 450136276,
          "name": "duckdb_cli-linux-arm64-musl.zip",
          "size": 20587807,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-arm64-musl.zip"
        },
        {
          "id": 450136289,
          "name": "duckdb_cli-linux-arm64.gz",
          "size": 19161036,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-arm64.gz"
        },
        {
          "id": 450136302,
          "name": "duckdb_cli-linux-arm64.zip",
          "size": 19255662,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-linux-arm64.zip"
        },
        {
          "id": 450136315,
          "name": "duckdb_cli-osx-amd64.gz",
          "size": 18453164,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-amd64.gz"
        },
        {
          "id": 450136329,
          "name": "duckdb_cli-osx-amd64.zip",
          "size": 18561984,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-amd64.zip"
        },
        {
          "id": 450136342,
          "name": "duckdb_cli-osx-arm64.gz",
          "size": 16243418,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-arm64.gz"
        },
        {
          "id": 450136351,
          "name": "duckdb_cli-osx-arm64.zip",
          "size": 16319183,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-arm64.zip"
        },
        {
          "id": 450136368,
          "name": "duckdb_cli-osx-universal.gz",
          "size": 34703224,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-universal.gz"
        },
        {
          "id": 450136380,
          "name": "duckdb_cli-osx-universal.zip",
          "size": 34881424,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-osx-universal.zip"
        },
        {
          "id": 450136391,
          "name": "duckdb_cli-windows-amd64.zip",
          "size": 12909728,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-windows-amd64.zip"
        },
        {
          "id": 450136398,
          "name": "duckdb_cli-windows-arm64.zip",
          "size": 13842342,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/duckdb_cli-windows-arm64.zip"
        },
        {
          "id": 450136484,
          "name": "libduckdb-linux-amd64-musl.zip",
          "size": 42538192,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-linux-amd64-musl.zip"
        },
        {
          "id": 450136492,
          "name": "libduckdb-linux-amd64.zip",
          "size": 41230069,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-linux-amd64.zip"
        },
        {
          "id": 450136514,
          "name": "libduckdb-linux-arm64-musl.zip",
          "size": 40070893,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-linux-arm64-musl.zip"
        },
        {
          "id": 450136527,
          "name": "libduckdb-linux-arm64.zip",
          "size": 37630482,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-linux-arm64.zip"
        },
        {
          "id": 450136544,
          "name": "libduckdb-osx-universal.zip",
          "size": 35056783,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-osx-universal.zip"
        },
        {
          "id": 450136557,
          "name": "libduckdb-src.zip",
          "size": 4960104,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-src.zip"
        },
        {
          "id": 450136566,
          "name": "libduckdb-windows-amd64.zip",
          "size": 13369510,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-windows-amd64.zip"
        },
        {
          "id": 450136581,
          "name": "libduckdb-windows-arm64.zip",
          "size": 14315057,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/libduckdb-windows-arm64.zip"
        },
        {
          "id": 450136587,
          "name": "static-libs-linux-amd64.zip",
          "size": 29916326,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/static-libs-linux-amd64.zip"
        },
        {
          "id": 450136602,
          "name": "static-libs-linux-arm64.zip",
          "size": 28716236,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/static-libs-linux-arm64.zip"
        },
        {
          "id": 450136624,
          "name": "static-libs-osx-amd64.zip",
          "size": 26982763,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/static-libs-osx-amd64.zip"
        },
        {
          "id": 450136658,
          "name": "static-libs-osx-arm64.zip",
          "size": 25469799,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/static-libs-osx-arm64.zip"
        },
        {
          "id": 450136675,
          "name": "static-libs-windows-mingw.zip",
          "size": 28607219,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/duckdb/duckdb/releases/download/v1.5.4/static-libs-windows-mingw.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "duckdb": "duckdb_cli-linux-amd64.zip"
      },
      "linux-arm64": {
        "duckdb": "duckdb_cli-linux-arm64.zip"
      },
      "darwin-x64": {
        "duckdb": "duckdb_cli-osx-amd64.zip"
      },
      "darwin-arm64": {
        "duckdb": "duckdb_cli-osx-arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "F1bonacc1/process-compose",
      "version": "v1.116.0"
    },
    "release": {
      "tag_name": "v1.116.0",
      "assets": [
        {
          "id": 449550221,
          "name": "process-compose_checksums.txt",
          "size": 804,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_checksums.txt"
        },
        {
          "id": 449550228,
          "name": "process-compose_darwin_amd64.tar.gz",
          "size": 15751165,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_darwin_amd64.tar.gz"
        },
        {
          "id": 449550226,
          "name": "process-compose_darwin_arm64.tar.gz",
          "size": 14852778,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_darwin_arm64.tar.gz"
        },
        {
          "id": 449550223,
          "name": "process-compose_linux_386.tar.gz",
          "size": 14882931,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_linux_386.tar.gz"
        },
        {
          "id": 449550222,
          "name": "process-compose_linux_amd64.tar.gz",
          "size": 15661144,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_linux_amd64.tar.gz"
        },
        {
          "id": 449550224,
          "name": "process-compose_linux_arm.tar.gz",
          "size": 14967261,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_linux_arm.tar.gz"
        },
        {
          "id": 449550220,
          "name": "process-compose_linux_arm64.tar.gz",
          "size": 14410443,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_linux_arm64.tar.gz"
        },
        {
          "id": 449550219,
          "name": "process-compose_windows_amd64.zip",
          "size": 15768180,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_windows_amd64.zip"
        },
        {
          "id": 449550225,
          "name": "process-compose_windows_arm64.zip",
          "size": 14343400,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/F1bonacc1/process-compose/releases/download/v1.116.0/process-compose_windows_arm64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "process-compose": "process-compose_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "process-compose": "process-compose_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "process-compose": "process-compose_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "process-compose": "process-compose_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "grafana/k6",
      "version": "v2.0.0"
    },
    "release": {
      "tag_name": "v2.0.0",
      "assets": [
        {
          "id": 417314424,
          "name": "k6-v2.0.0-checksums.txt",
          "size": 746,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-checksums.txt"
        },
        {
          "id": 417314423,
          "name": "k6-v2.0.0-linux-amd64.deb",
          "size": 27948770,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-linux-amd64.deb"
        },
        {
          "id": 417314425,
          "name": "k6-v2.0.0-linux-amd64.rpm",
          "size": 30601891,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-linux-amd64.rpm"
        },
        {
          "id": 417314420,
          "name": "k6-v2.0.0-linux-amd64.tar.gz",
          "size": 29494294,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-linux-amd64.tar.gz"
        },
        {
          "id": 417314422,
          "name": "k6-v2.0.0-linux-arm64.tar.gz",
          "size": 27112521,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-linux-arm64.tar.gz"
        },
        {
          "id": 417314434,
          "name": "k6-v2.0.0-macos-amd64.zip",
          "size": 30541225,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-macos-amd64.zip"
        },
        {
          "id": 417314445,
          "name": "k6-v2.0.0-macos-arm64.zip",
          "size": 28797044,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-macos-arm64.zip"
        },
        {
          "id": 417314448,
          "name": "k6-v2.0.0-spdx.json",
          "size": 464844,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-spdx.json"
        },
        {
          "id": 417314449,
          "name": "k6-v2.0.0-windows-amd64.msi",
          "size": 30322688,
          "content_type": "application/x-msi",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-windows-amd64.msi"
        },
        {
          "id": 417314456,
          "name": "k6-v2.0.0-windows-amd64.zip",
          "size": 29790240,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/grafana/k6/releases/download/v2.0.0/k6-v2.0.0-windows-amd64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "k6": "k6-v2.0.0-linux-amd64.tar.gz"
      },
      "linux-arm64": {
        "k6": "k6-v2.0.0-linux-arm64.tar.gz"
      },
      "darwin-x64": {
        "k6": "k6-v2.0.0-macos-amd64.zip"
      },
      "darwin-arm64": {
        "k6": "k6-v2.0.0-macos-arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "Jguer/yay"
    },
    "release": {
      "tag_name": "v13.0.1",
      "assets": [
        {
          "id": 452475924,
          "name": "yay_13.0.1_aarch64.tar.gz",
          "size": 4422585,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Jguer/yay/releases/download/v13.0.1/yay_13.0.1_aarch64.tar.gz"
        },
        {
          "id": 452475923,
          "name": "yay_13.0.1_armv7h.tar.gz",
          "size": 4710074,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Jguer/yay/releases/download/v13.0.1/yay_13.0.1_armv7h.tar.gz"
        },
        {
          "id": 452475922,
          "name": "yay_13.0.1_x86_64.tar.gz",
          "size": 4922909,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Jguer/yay/releases/download/v13.0.1/yay_13.0.1_x86_64.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "yay": "yay_13.0.1_x86_64.tar.gz"
      },
      "linux-arm64": {
        "yay": "yay_13.0.1_aarch64.tar.gz"
      },
      "darwin-x64": {
        "yay": null
      },
      "darwin-arm64": {
        "yay": null
      }
    }
  },
  {
    "pkg": {
      "repo": "joerdav/xc"
    },
    "release": {
      "tag_name": "v0.9.0",
      "assets": [
        {
          "id": 336593210,
          "name": "checksums.txt",
          "size": 2027,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/checksums.txt"
        },
        {
          "id": 336593211,
          "name": "checksums.txt.sig",
          "size": 566,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/checksums.txt.sig"
        },
        {
          "id": 336593169,
          "name": "xc_0.9.0_darwin_amd64",
          "size": 4970656,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_darwin_amd64"
        },
        {
          "id": 336593202,
          "name": "xc_0.9.0_darwin_amd64.tar.gz",
          "size": 2008597,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_darwin_amd64.tar.gz"
        },
        {
          "id": 336593181,
          "name": "xc_0.9.0_darwin_arm64",
          "size": 4890130,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_darwin_arm64"
        },
        {
          "id": 336593189,
          "name": "xc_0.9.0_darwin_arm64.tar.gz",
          "size": 1913510,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_darwin_arm64.tar.gz"
        },
        {
          "id": 336593174,
          "name": "xc_0.9.0_linux_386",
          "size": 4550808,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_386"
        },
        {
          "id": 336593197,
          "name": "xc_0.9.0_linux_386.tar.gz",
          "size": 1876693,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_386.tar.gz"
        },
        {
          "id": 336593177,
          "name": "xc_0.9.0_linux_amd64",
          "size": 4911364,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_amd64"
        },
        {
          "id": 336593198,
          "name": "xc_0.9.0_linux_amd64.tar.gz",
          "size": 2000740,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_amd64.tar.gz"
        },
        {
          "id": 336593175,
          "name": "xc_0.9.0_linux_arm64",
          "size": 4849816,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_arm64"
        },
        {
          "id": 336593190,
          "name": "xc_0.9.0_linux_arm64.tar.gz",
          "size": 1857622,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_arm64.tar.gz"
        },
        {
          "id": 336593180,
          "name": "xc_0.9.0_linux_armv7",
          "size": 4718744,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_armv7"
        },
        {
          "id": 336593203,
          "name": "xc_0.9.0_linux_armv7.tar.gz",
          "size": 1874722,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_linux_armv7.tar.gz"
        },
        {
          "id": 336593176,
          "name": "xc_0.9.0_windows_386.exe",
          "size": 4792832,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_386.exe"
        },
        {
          "id": 336593205,
          "name": "xc_0.9.0_windows_386.tar.gz",
          "size": 1990749,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_386.tar.gz"
        },
        {
          "id": 336593179,
          "name": "xc_0.9.0_windows_amd64.exe",
          "size": 5188608,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_amd64.exe"
        },
        {
          "id": 336593191,
          "name": "xc_0.9.0_windows_amd64.tar.gz",
          "size": 2092711,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_amd64.tar.gz"
        },
        {
          "id": 336593172,
          "name": "xc_0.9.0_windows_arm64.exe",
          "size": 4994048,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_arm64.exe"
        },
        {
          "id": 336593207,
          "name": "xc_0.9.0_windows_arm64.tar.gz",
          "size": 1917862,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_arm64.tar.gz"
        },
        {
          "id": 336593170,
          "name": "xc_0.9.0_windows_armv6.exe",
          "size": 4860416,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_armv6.exe"
        },
        {
          "id": 336593182,
          "name": "xc_0.9.0_windows_armv6.tar.gz",
          "size": 1964295,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_armv6.tar.gz"
        },
        {
          "id": 336593171,
          "name": "xc_0.9.0_windows_armv7.exe",
          "size": 4846592,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_armv7.exe"
        },
        {
          "id": 336593192,
          "name": "xc_0.9.0_windows_armv7.tar.gz",
          "size": 1956461,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/joerdav/xc/releases/download/v0.9.0/xc_0.9.0_windows_armv7.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "xc": "xc_0.9.0_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "xc": "xc_0.9.0_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "xc": "xc_0.9.0_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "xc": "xc_0.9.0_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "junegunn/fzf"
    },
    "release": {
      "tag_name": "v0.73.1",
      "assets": [
        {
          "id": 429088736,
          "name": "fzf-0.73.1-android_arm64.tar.gz",
          "size": 1880018,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-android_arm64.tar.gz"
        },
        {
          "id": 429088719,
          "name": "fzf-0.73.1-darwin_amd64.tar.gz",
          "size": 2025742,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-darwin_amd64.tar.gz"
        },
        {
          "id": 429088717,
          "name": "fzf-0.73.1-darwin_arm64.tar.gz",
          "size": 1861771,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-darwin_arm64.tar.gz"
        },
        {
          "id": 429088771,
          "name": "fzf-0.73.1-freebsd_amd64.tar.gz",
          "size": 1933696,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-freebsd_amd64.tar.gz"
        },
        {
          "id": 429088716,
          "name": "fzf-0.73.1-linux_amd64.tar.gz",
          "size": 1969160,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_amd64.tar.gz"
        },
        {
          "id": 429088746,
          "name": "fzf-0.73.1-linux_arm64.tar.gz",
          "size": 1804720,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_arm64.tar.gz"
        },
        {
          "id": 429088725,
          "name": "fzf-0.73.1-linux_armv5.tar.gz",
          "size": 1861407,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_armv5.tar.gz"
        },
        {
          "id": 429088752,
          "name": "fzf-0.73.1-linux_armv6.tar.gz",
          "size": 1852072,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_armv6.tar.gz"
        },
        {
          "id": 429088726,
          "name": "fzf-0.73.1-linux_armv7.tar.gz",
          "size": 1848345,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_armv7.tar.gz"
        },
        {
          "id": 429088754,
          "name": "fzf-0.73.1-linux_loong64.tar.gz",
          "size": 1890765,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_loong64.tar.gz"
        },
        {
          "id": 429088747,
          "name": "fzf-0.73.1-linux_ppc64le.tar.gz",
          "size": 1823393,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_ppc64le.tar.gz"
        },
        {
          "id": 429088737,
          "name": "fzf-0.73.1-linux_riscv64.tar.gz",
          "size": 1833645,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_riscv64.tar.gz"
        },
        {
          "id": 429088738,
          "name": "fzf-0.73.1-linux_s390x.tar.gz",
          "size": 1900934,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-linux_s390x.tar.gz"
        },
        {
          "id": 429088755,
          "name": "fzf-0.73.1-openbsd_amd64.tar.gz",
          "size": 1933759,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-openbsd_amd64.tar.gz"
        },
        {
          "id": 429088728,
          "name": "fzf-0.73.1-windows_amd64.zip",
          "size": 2149253,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-windows_amd64.zip"
        },
        {
          "id": 429088744,
          "name": "fzf-0.73.1-windows_arm64.zip",
          "size": 1950187,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf-0.73.1-windows_arm64.zip"
        },
        {
          "id": 429088775,
          "name": "fzf_0.73.1_checksums.txt",
          "size": 1548,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/junegunn/fzf/releases/download/v0.73.1/fzf_0.73.1_checksums.txt"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "fzf": "fzf-0.73.1-linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "fzf": "fzf-0.73.1-linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "fzf": "fzf-0.73.1-darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "fzf": "fzf-0.73.1-darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "k1LoW/mo",
      "version": "v1.6.0"
    },
    "release": {
      "tag_name": "v1.6.0",
      "assets": [
        {
          "id": 451297401,
          "name": "checksums.txt",
          "size": 995,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/checksums.txt"
        },
        {
          "id": 451297380,
          "name": "mo_1.6.0-1_amd64.apk",
          "size": 8312639,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_amd64.apk"
        },
        {
          "id": 451297379,
          "name": "mo_1.6.0-1_amd64.deb",
          "size": 7903816,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_amd64.deb"
        },
        {
          "id": 451297358,
          "name": "mo_1.6.0-1_amd64.rpm",
          "size": 7921011,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_amd64.rpm"
        },
        {
          "id": 451297398,
          "name": "mo_1.6.0-1_arm64.apk",
          "size": 7969467,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_arm64.apk"
        },
        {
          "id": 451297378,
          "name": "mo_1.6.0-1_arm64.deb",
          "size": 7574472,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_arm64.deb"
        },
        {
          "id": 451297399,
          "name": "mo_1.6.0-1_arm64.rpm",
          "size": 7578039,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_1.6.0-1_arm64.rpm"
        },
        {
          "id": 451297335,
          "name": "mo_v1.6.0_darwin_amd64.zip",
          "size": 8053547,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_v1.6.0_darwin_amd64.zip"
        },
        {
          "id": 451297336,
          "name": "mo_v1.6.0_darwin_arm64.zip",
          "size": 7940498,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_v1.6.0_darwin_arm64.zip"
        },
        {
          "id": 451297355,
          "name": "mo_v1.6.0_linux_amd64.tar.gz",
          "size": 7937371,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_v1.6.0_linux_amd64.tar.gz"
        },
        {
          "id": 451297357,
          "name": "mo_v1.6.0_linux_arm64.tar.gz",
          "size": 7608399,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_v1.6.0_linux_arm64.tar.gz"
        },
        {
          "id": 451297334,
          "name": "mo_v1.6.0_windows_amd64.tar.gz",
          "size": 8043711,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/k1LoW/mo/releases/download/v1.6.0/mo_v1.6.0_windows_amd64.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "mo": "mo_v1.6.0_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "mo": "mo_v1.6.0_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "mo": "mo_v1.6.0_darwin_amd64.zip"
      },
      "darwin-arm64": {
        "mo": "mo_v1.6.0_darwin_arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "keidarcy/e1s",
      "version": "v1.0.53"
    },
    "release": {
      "tag_name": "v1.0.53",
      "assets": [
        {
          "id": 343242225,
          "name": "e1s_1.0.53_checksums.txt",
          "size": 483,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_checksums.txt"
        },
        {
          "id": 343242224,
          "name": "e1s_1.0.53_darwin_all.tar.gz",
          "size": 16621280,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_darwin_all.tar.gz"
        },
        {
          "id": 343242215,
          "name": "e1s_1.0.53_linux_amd64.tar.gz",
          "size": 8351648,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_linux_amd64.tar.gz"
        },
        {
          "id": 343242218,
          "name": "e1s_1.0.53_linux_arm64.tar.gz",
          "size": 7625647,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_linux_arm64.tar.gz"
        },
        {
          "id": 343242217,
          "name": "e1s_1.0.53_windows_amd64.tar.gz",
          "size": 8530923,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_windows_amd64.tar.gz"
        },
        {
          "id": 343242216,
          "name": "e1s_1.0.53_windows_arm64.tar.gz",
          "size": 7669250,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/keidarcy/e1s/releases/download/v1.0.53/e1s_1.0.53_windows_arm64.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "e1s": "e1s_1.0.53_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "e1s": "e1s_1.0.53_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "e1s": "e1s_1.0.53_darwin_all.tar.gz"
      },
      "darwin-arm64": {
        "e1s": "e1s_1.0.53_darwin_all.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "mfontanini/presenterm",
      "version": "v0.16.1"
    },
    "release": {
      "tag_name": "v0.16.1",
      "assets": [
        {
          "id": 358918054,
          "name": "presenterm-0.16.1-aarch64-apple-darwin.tar.gz",
          "size": 3454533,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 358918048,
          "name": "presenterm-0.16.1-aarch64-apple-darwin.tar.gz.sha512",
          "size": 176,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-apple-darwin.tar.gz.sha512"
        },
        {
          "id": 358918269,
          "name": "presenterm-0.16.1-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3591749,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 358918213,
          "name": "presenterm-0.16.1-aarch64-unknown-linux-gnu.tar.gz.sha512",
          "size": 181,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-unknown-linux-gnu.tar.gz.sha512"
        },
        {
          "id": 358918301,
          "name": "presenterm-0.16.1-aarch64-unknown-linux-musl.tar.gz",
          "size": 3635120,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 358918298,
          "name": "presenterm-0.16.1-aarch64-unknown-linux-musl.tar.gz.sha512",
          "size": 182,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-aarch64-unknown-linux-musl.tar.gz.sha512"
        },
        {
          "id": 358918157,
          "name": "presenterm-0.16.1-armv5te-unknown-linux-gnueabi.tar.gz",
          "size": 3681129,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-armv5te-unknown-linux-gnueabi.tar.gz"
        },
        {
          "id": 358918145,
          "name": "presenterm-0.16.1-armv5te-unknown-linux-gnueabi.tar.gz.sha512",
          "size": 185,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-armv5te-unknown-linux-gnueabi.tar.gz.sha512"
        },
        {
          "id": 358918273,
          "name": "presenterm-0.16.1-armv7-unknown-linux-gnueabihf.tar.gz",
          "size": 3634741,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-armv7-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 358918272,
          "name": "presenterm-0.16.1-armv7-unknown-linux-gnueabihf.tar.gz.sha512",
          "size": 185,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-armv7-unknown-linux-gnueabihf.tar.gz.sha512"
        },
        {
          "id": 358918606,
          "name": "presenterm-0.16.1-i686-pc-windows-msvc.zip",
          "size": 3260405,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-pc-windows-msvc.zip"
        },
        {
          "id": 358918605,
          "name": "presenterm-0.16.1-i686-pc-windows-msvc.zip.sha512",
          "size": 173,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-pc-windows-msvc.zip.sha512"
        },
        {
          "id": 358918193,
          "name": "presenterm-0.16.1-i686-unknown-linux-gnu.tar.gz",
          "size": 3770366,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 358918189,
          "name": "presenterm-0.16.1-i686-unknown-linux-gnu.tar.gz.sha512",
          "size": 178,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-unknown-linux-gnu.tar.gz.sha512"
        },
        {
          "id": 358918290,
          "name": "presenterm-0.16.1-i686-unknown-linux-musl.tar.gz",
          "size": 3760397,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 358918286,
          "name": "presenterm-0.16.1-i686-unknown-linux-musl.tar.gz.sha512",
          "size": 179,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-i686-unknown-linux-musl.tar.gz.sha512"
        },
        {
          "id": 358918835,
          "name": "presenterm-0.16.1-x86_64-apple-darwin.tar.gz",
          "size": 3627654,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 358918829,
          "name": "presenterm-0.16.1-x86_64-apple-darwin.tar.gz.sha512",
          "size": 175,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-apple-darwin.tar.gz.sha512"
        },
        {
          "id": 358918675,
          "name": "presenterm-0.16.1-x86_64-pc-windows-msvc.zip",
          "size": 3429089,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 358918671,
          "name": "presenterm-0.16.1-x86_64-pc-windows-msvc.zip.sha512",
          "size": 175,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-pc-windows-msvc.zip.sha512"
        },
        {
          "id": 358917905,
          "name": "presenterm-0.16.1-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3717602,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 358917899,
          "name": "presenterm-0.16.1-x86_64-unknown-linux-gnu.tar.gz.sha512",
          "size": 180,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-unknown-linux-gnu.tar.gz.sha512"
        },
        {
          "id": 358918116,
          "name": "presenterm-0.16.1-x86_64-unknown-linux-musl.tar.gz",
          "size": 3800922,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 358918105,
          "name": "presenterm-0.16.1-x86_64-unknown-linux-musl.tar.gz.sha512",
          "size": 181,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mfontanini/presenterm/releases/download/v0.16.1/presenterm-0.16.1-x86_64-unknown-linux-musl.tar.gz.sha512"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "presenterm": "presenterm-0.16.1-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "presenterm": "presenterm-0.16.1-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "presenterm": "presenterm-0.16.1-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "presenterm": "presenterm-0.16.1-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "multiprocessio/dsq"
    },
    "release": {
      "tag_name": "v0.23.0",
      "assets": [
        {
          "id": 81728813,
          "name": "dsq-darwin-x64-v0.23.0.zip",
          "size": 19528832,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/multiprocessio/dsq/releases/download/v0.23.0/dsq-darwin-x64-v0.23.0.zip"
        },
        {
          "id": 81728447,
          "name": "dsq-linux-x64-v0.23.0.zip",
          "size": 21499429,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/multiprocessio/dsq/releases/download/v0.23.0/dsq-linux-x64-v0.23.0.zip"
        },
        {
          "id": 81728918,
          "name": "dsq-win32-x64-v0.23.0.zip",
          "size": 16048648,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/multiprocessio/dsq/releases/download/v0.23.0/dsq-win32-x64-v0.23.0.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "dsq": "dsq-linux-x64-v0.23.0.zip"
      },
      "linux-arm64": {
        "dsq": null
      },
      "darwin-x64": {
        "dsq": "dsq-darwin-x64-v0.23.0.zip"
      },
      "darwin-arm64": {
        "dsq": null
      }
    }
  },
  {
    "pkg": {
      "repo": "mutagen-io/mutagen-compose"
    },
    "release": {
      "tag_name": "v0.18.1",
      "assets": [
        {
          "id": 232250666,
          "name": "mutagen-compose_darwin_amd64_v0.18.1.tar.gz",
          "size": 37907290,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_darwin_amd64_v0.18.1.tar.gz"
        },
        {
          "id": 232250671,
          "name": "mutagen-compose_darwin_arm64_v0.18.1.tar.gz",
          "size": 34595286,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_darwin_arm64_v0.18.1.tar.gz"
        },
        {
          "id": 232250675,
          "name": "mutagen-compose_linux_386_v0.18.1.tar.gz",
          "size": 33676883,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_386_v0.18.1.tar.gz"
        },
        {
          "id": 232250680,
          "name": "mutagen-compose_linux_amd64_v0.18.1.tar.gz",
          "size": 36067065,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_amd64_v0.18.1.tar.gz"
        },
        {
          "id": 232250688,
          "name": "mutagen-compose_linux_arm64_v0.18.1.tar.gz",
          "size": 33741674,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_arm64_v0.18.1.tar.gz"
        },
        {
          "id": 232250685,
          "name": "mutagen-compose_linux_arm_v0.18.1.tar.gz",
          "size": 33025660,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_arm_v0.18.1.tar.gz"
        },
        {
          "id": 232250702,
          "name": "mutagen-compose_linux_mips64le_v0.18.1.tar.gz",
          "size": 30919194,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_mips64le_v0.18.1.tar.gz"
        },
        {
          "id": 232250698,
          "name": "mutagen-compose_linux_mips64_v0.18.1.tar.gz",
          "size": 31758306,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_mips64_v0.18.1.tar.gz"
        },
        {
          "id": 232250708,
          "name": "mutagen-compose_linux_mipsle_v0.18.1.tar.gz",
          "size": 31663204,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_mipsle_v0.18.1.tar.gz"
        },
        {
          "id": 232250692,
          "name": "mutagen-compose_linux_mips_v0.18.1.tar.gz",
          "size": 32190667,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_mips_v0.18.1.tar.gz"
        },
        {
          "id": 232250721,
          "name": "mutagen-compose_linux_ppc64le_v0.18.1.tar.gz",
          "size": 33585780,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_ppc64le_v0.18.1.tar.gz"
        },
        {
          "id": 232250717,
          "name": "mutagen-compose_linux_ppc64_v0.18.1.tar.gz",
          "size": 34042465,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_ppc64_v0.18.1.tar.gz"
        },
        {
          "id": 232250728,
          "name": "mutagen-compose_linux_riscv64_v0.18.1.tar.gz",
          "size": 34228103,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_riscv64_v0.18.1.tar.gz"
        },
        {
          "id": 232250738,
          "name": "mutagen-compose_linux_s390x_v0.18.1.tar.gz",
          "size": 35111230,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_linux_s390x_v0.18.1.tar.gz"
        },
        {
          "id": 232250744,
          "name": "mutagen-compose_windows_386_v0.18.1.tar.gz",
          "size": 34555281,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_386_v0.18.1.tar.gz"
        },
        {
          "id": 232250749,
          "name": "mutagen-compose_windows_386_v0.18.1.zip",
          "size": 34195132,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_386_v0.18.1.zip"
        },
        {
          "id": 232250752,
          "name": "mutagen-compose_windows_amd64_v0.18.1.tar.gz",
          "size": 36715166,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_amd64_v0.18.1.tar.gz"
        },
        {
          "id": 232250759,
          "name": "mutagen-compose_windows_amd64_v0.18.1.zip",
          "size": 36286396,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_amd64_v0.18.1.zip"
        },
        {
          "id": 232250783,
          "name": "mutagen-compose_windows_arm64_v0.18.1.tar.gz",
          "size": 34048901,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_arm64_v0.18.1.tar.gz"
        },
        {
          "id": 232250787,
          "name": "mutagen-compose_windows_arm64_v0.18.1.zip",
          "size": 33587680,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_arm64_v0.18.1.zip"
        },
        {
          "id": 232250766,
          "name": "mutagen-compose_windows_arm_v0.18.1.tar.gz",
          "size": 33411500,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_arm_v0.18.1.tar.gz"
        },
        {
          "id": 232250779,
          "name": "mutagen-compose_windows_arm_v0.18.1.zip",
          "size": 32946085,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/mutagen-compose_windows_arm_v0.18.1.zip"
        },
        {
          "id": 232250791,
          "name": "SHA256SUMS",
          "size": 2400,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/SHA256SUMS"
        },
        {
          "id": 232250792,
          "name": "SHA256SUMS.gpg",
          "size": 833,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/mutagen-io/mutagen-compose/releases/download/v0.18.1/SHA256SUMS.gpg"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "mutagen-compose": "mutagen-compose_linux_amd64_v0.18.1.tar.gz"
      },
      "linux-arm64": {
        "mutagen-compose": "mutagen-compose_linux_arm64_v0.18.1.tar.gz"
      },
      "darwin-x64": {
        "mutagen-compose": "mutagen-compose_darwin_amd64_v0.18.1.tar.gz"
      },
      "darwin-arm64": {
        "mutagen-compose": "mutagen-compose_darwin_arm64_v0.18.1.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "nats-io/natscli",
      "version": "v0.4.0"
    },
    "release": {
      "tag_name": "v0.4.0",
      "assets": [
        {
          "id": 409778120,
          "name": "nats-0.4.0-386.deb",
          "size": 9073086,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-386.deb"
        },
        {
          "id": 409778137,
          "name": "nats-0.4.0-386.rpm",
          "size": 9049062,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-386.rpm"
        },
        {
          "id": 409778119,
          "name": "nats-0.4.0-amd64.deb",
          "size": 9596428,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-amd64.deb"
        },
        {
          "id": 409778147,
          "name": "nats-0.4.0-amd64.rpm",
          "size": 9571125,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-amd64.rpm"
        },
        {
          "id": 409778118,
          "name": "nats-0.4.0-arm6.deb",
          "size": 9124738,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm6.deb"
        },
        {
          "id": 409778148,
          "name": "nats-0.4.0-arm6.rpm",
          "size": 9076152,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm6.rpm"
        },
        {
          "id": 409778139,
          "name": "nats-0.4.0-arm64.deb",
          "size": 8611650,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm64.deb"
        },
        {
          "id": 409778153,
          "name": "nats-0.4.0-arm64.rpm",
          "size": 8566130,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm64.rpm"
        },
        {
          "id": 409778138,
          "name": "nats-0.4.0-arm7.deb",
          "size": 9109788,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm7.deb"
        },
        {
          "id": 409778149,
          "name": "nats-0.4.0-arm7.rpm",
          "size": 9063933,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-arm7.rpm"
        },
        {
          "id": 409778086,
          "name": "nats-0.4.0-darwin-amd64.zip",
          "size": 9789974,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-darwin-amd64.zip"
        },
        {
          "id": 409778085,
          "name": "nats-0.4.0-darwin-arm64.zip",
          "size": 8996902,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-darwin-arm64.zip"
        },
        {
          "id": 409778087,
          "name": "nats-0.4.0-freebsd-amd64.zip",
          "size": 9574739,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-freebsd-amd64.zip"
        },
        {
          "id": 409778088,
          "name": "nats-0.4.0-linux-386.zip",
          "size": 9086379,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-386.zip"
        },
        {
          "id": 409778099,
          "name": "nats-0.4.0-linux-amd64.zip",
          "size": 9609864,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-amd64.zip"
        },
        {
          "id": 409778096,
          "name": "nats-0.4.0-linux-arm6.zip",
          "size": 9138030,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-arm6.zip"
        },
        {
          "id": 409778103,
          "name": "nats-0.4.0-linux-arm64.zip",
          "size": 8624883,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-arm64.zip"
        },
        {
          "id": 409778098,
          "name": "nats-0.4.0-linux-arm7.zip",
          "size": 9122956,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-arm7.zip"
        },
        {
          "id": 409778108,
          "name": "nats-0.4.0-linux-s390x.zip",
          "size": 9254149,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-linux-s390x.zip"
        },
        {
          "id": 409778117,
          "name": "nats-0.4.0-s390x.deb",
          "size": 9240898,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-s390x.deb"
        },
        {
          "id": 409778136,
          "name": "nats-0.4.0-s390x.rpm",
          "size": 9219455,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-s390x.rpm"
        },
        {
          "id": 409778109,
          "name": "nats-0.4.0-windows-386.zip",
          "size": 9532068,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-windows-386.zip"
        },
        {
          "id": 409778106,
          "name": "nats-0.4.0-windows-amd64.zip",
          "size": 9873015,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-windows-amd64.zip"
        },
        {
          "id": 409778110,
          "name": "nats-0.4.0-windows-arm64.zip",
          "size": 8740382,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/nats-0.4.0-windows-arm64.zip"
        },
        {
          "id": 409778157,
          "name": "SHA256SUMS",
          "size": 2156,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/nats-io/natscli/releases/download/v0.4.0/SHA256SUMS"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "nats": "nats-0.4.0-linux-amd64.zip"
      },
      "linux-arm64": {
        "nats": "nats-0.4.0-linux-arm64.zip"
      },
      "darwin-x64": {
        "nats": "nats-0.4.0-darwin-amd64.zip"
      },
      "darwin-arm64": {
        "nats": "nats-0.4.0-darwin-arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "ogham/exa"
    },
    "release": {
      "tag_name": "v0.10.1",
      "assets": [
        {
          "id": 34895430,
          "name": "exa-accoutrements-v0.10.1.zip",
          "size": 9343,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-accoutrements-v0.10.1.zip"
        },
        {
          "id": 34895432,
          "name": "exa-linux-armv7-v0.10.1.zip",
          "size": 646871,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-linux-armv7-v0.10.1.zip"
        },
        {
          "id": 34895439,
          "name": "exa-linux-x86_64-musl-v0.10.1.zip",
          "size": 900205,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-linux-x86_64-musl-v0.10.1.zip"
        },
        {
          "id": 34895441,
          "name": "exa-linux-x86_64-v0.10.1.zip",
          "size": 726433,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-linux-x86_64-v0.10.1.zip"
        },
        {
          "id": 34895442,
          "name": "exa-macos-x86_64-v0.10.1.zip",
          "size": 627486,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-macos-x86_64-v0.10.1.zip"
        },
        {
          "id": 34895444,
          "name": "exa-vendored-source-v0.10.1.zip",
          "size": 21896045,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/ogham/exa/releases/download/v0.10.1/exa-vendored-source-v0.10.1.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "exa": "exa-linux-x86_64-v0.10.1.zip"
      },
      "linux-arm64": {
        "exa": null
      },
      "darwin-x64": {
        "exa": "exa-macos-x86_64-v0.10.1.zip"
      },
      "darwin-arm64": {
        "exa": null
      }
    }
  },
  {
    "pkg": {
      "repo": "open-cli-collective/atlassian-cli",
      "binaries": [
        {
          "name": "cfl"
        }
      ],
      "assetHints": {
        "select": "cfl"
      }
    },
    "release": {
      "tag_name": "cfl-v1.2.61",
      "assets": [
        {
          "id": 437737534,
          "name": "cfl_1.2.61_darwin_amd64.tar.gz",
          "size": 10907265,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_darwin_amd64.tar.gz"
        },
        {
          "id": 437737521,
          "name": "cfl_1.2.61_darwin_arm64.tar.gz",
          "size": 10188887,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_darwin_arm64.tar.gz"
        },
        {
          "id": 437737551,
          "name": "cfl_1.2.61_linux_amd64.deb",
          "size": 5291376,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_amd64.deb"
        },
        {
          "id": 437737540,
          "name": "cfl_1.2.61_linux_amd64.rpm",
          "size": 5279191,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_amd64.rpm"
        },
        {
          "id": 437737519,
          "name": "cfl_1.2.61_linux_amd64.tar.gz",
          "size": 5296152,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_amd64.tar.gz"
        },
        {
          "id": 437737550,
          "name": "cfl_1.2.61_linux_arm64.deb",
          "size": 4798252,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_arm64.deb"
        },
        {
          "id": 437737552,
          "name": "cfl_1.2.61_linux_arm64.rpm",
          "size": 4777247,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_arm64.rpm"
        },
        {
          "id": 437737528,
          "name": "cfl_1.2.61_linux_arm64.tar.gz",
          "size": 4807106,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_linux_arm64.tar.gz"
        },
        {
          "id": 437737530,
          "name": "cfl_1.2.61_windows_amd64.zip",
          "size": 10834462,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_windows_amd64.zip"
        },
        {
          "id": 437737520,
          "name": "cfl_1.2.61_windows_arm64.zip",
          "size": 9997423,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/cfl_1.2.61_windows_arm64.zip"
        },
        {
          "id": 437737556,
          "name": "checksums.txt",
          "size": 948,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/cfl-v1.2.61/checksums.txt"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "cfl": "cfl_1.2.61_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "cfl": "cfl_1.2.61_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "cfl": "cfl_1.2.61_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "cfl": "cfl_1.2.61_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "open-cli-collective/atlassian-cli",
      "binaries": [
        {
          "name": "jtk"
        }
      ],
      "assetHints": {
        "select": "jtk"
      }
    },
    "release": {
      "tag_name": "jtk-v1.2.133",
      "assets": [
        {
          "id": 437743595,
          "name": "checksums.txt",
          "size": 958,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/checksums.txt"
        },
        {
          "id": 437743574,
          "name": "jtk_1.2.133_darwin_amd64.tar.gz",
          "size": 10862019,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_darwin_amd64.tar.gz"
        },
        {
          "id": 437743558,
          "name": "jtk_1.2.133_darwin_arm64.tar.gz",
          "size": 10134255,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_darwin_arm64.tar.gz"
        },
        {
          "id": 437743591,
          "name": "jtk_1.2.133_linux_amd64.deb",
          "size": 5241682,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_amd64.deb"
        },
        {
          "id": 437743594,
          "name": "jtk_1.2.133_linux_amd64.rpm",
          "size": 5233449,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_amd64.rpm"
        },
        {
          "id": 437743560,
          "name": "jtk_1.2.133_linux_amd64.tar.gz",
          "size": 5254454,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_amd64.tar.gz"
        },
        {
          "id": 437743588,
          "name": "jtk_1.2.133_linux_arm64.deb",
          "size": 4745924,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_arm64.deb"
        },
        {
          "id": 437743585,
          "name": "jtk_1.2.133_linux_arm64.rpm",
          "size": 4725741,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_arm64.rpm"
        },
        {
          "id": 437743571,
          "name": "jtk_1.2.133_linux_arm64.tar.gz",
          "size": 4759913,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_linux_arm64.tar.gz"
        },
        {
          "id": 437743573,
          "name": "jtk_1.2.133_windows_amd64.zip",
          "size": 10735569,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_windows_amd64.zip"
        },
        {
          "id": 437743559,
          "name": "jtk_1.2.133_windows_arm64.zip",
          "size": 9907615,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/open-cli-collective/atlassian-cli/releases/download/jtk-v1.2.133/jtk_1.2.133_windows_arm64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "jtk": "jtk_1.2.133_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "jtk": "jtk_1.2.133_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "jtk": "jtk_1.2.133_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "jtk": "jtk_1.2.133_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "openai/codex",
      "version": "rust-v0.141.0"
    },
    "release": {
      "tag_name": "rust-v0.141.0",
      "assets": [
        {
          "id": 450878921,
          "name": "argument-comment-lint",
          "size": 2693,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/argument-comment-lint"
        },
        {
          "id": 450877503,
          "name": "argument-comment-lint-aarch64-apple-darwin.tar.gz",
          "size": 3394734,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/argument-comment-lint-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877515,
          "name": "argument-comment-lint-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3765320,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/argument-comment-lint-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 450877512,
          "name": "argument-comment-lint-x86_64-pc-windows-msvc.zip",
          "size": 3256969,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/argument-comment-lint-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 450877504,
          "name": "argument-comment-lint-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3874286,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/argument-comment-lint-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 450878822,
          "name": "bwrap",
          "size": 1217,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap"
        },
        {
          "id": 450877519,
          "name": "bwrap-aarch64-unknown-linux-musl.sigstore",
          "size": 8585,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-aarch64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877525,
          "name": "bwrap-aarch64-unknown-linux-musl.tar.gz",
          "size": 254884,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877523,
          "name": "bwrap-aarch64-unknown-linux-musl.zst",
          "size": 231197,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-aarch64-unknown-linux-musl.zst"
        },
        {
          "id": 450877438,
          "name": "bwrap-x86_64-unknown-linux-musl.sigstore",
          "size": 8585,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-x86_64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877442,
          "name": "bwrap-x86_64-unknown-linux-musl.tar.gz",
          "size": 261600,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877445,
          "name": "bwrap-x86_64-unknown-linux-musl.zst",
          "size": 237773,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/bwrap-x86_64-unknown-linux-musl.zst"
        },
        {
          "id": 450878672,
          "name": "codex",
          "size": 3695,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex"
        },
        {
          "id": 450877549,
          "name": "codex-aarch64-apple-darwin.dmg",
          "size": 103509972,
          "content_type": "application/x-apple-diskimage",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-apple-darwin.dmg"
        },
        {
          "id": 450877558,
          "name": "codex-aarch64-apple-darwin.tar.gz",
          "size": 90924841,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877550,
          "name": "codex-aarch64-apple-darwin.zst",
          "size": 65182628,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-apple-darwin.zst"
        },
        {
          "id": 450877547,
          "name": "codex-aarch64-pc-windows-msvc.exe",
          "size": 269256496,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 450877560,
          "name": "codex-aarch64-pc-windows-msvc.exe.tar.gz",
          "size": 97178271,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877552,
          "name": "codex-aarch64-pc-windows-msvc.exe.zip",
          "size": 98234268,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877565,
          "name": "codex-aarch64-pc-windows-msvc.exe.zst",
          "size": 72360260,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877509,
          "name": "codex-aarch64-unknown-linux-musl-bundle.tar.zst",
          "size": 68191751,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-unknown-linux-musl-bundle.tar.zst"
        },
        {
          "id": 450877514,
          "name": "codex-aarch64-unknown-linux-musl.sigstore",
          "size": 8565,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877532,
          "name": "codex-aarch64-unknown-linux-musl.tar.gz",
          "size": 93907736,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877533,
          "name": "codex-aarch64-unknown-linux-musl.zst",
          "size": 67958297,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-aarch64-unknown-linux-musl.zst"
        },
        {
          "id": 450878776,
          "name": "codex-app-server",
          "size": 3904,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server"
        },
        {
          "id": 450877559,
          "name": "codex-app-server-aarch64-apple-darwin.tar.gz",
          "size": 76353920,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877556,
          "name": "codex-app-server-aarch64-apple-darwin.zst",
          "size": 54334430,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-apple-darwin.zst"
        },
        {
          "id": 450877557,
          "name": "codex-app-server-aarch64-pc-windows-msvc.exe",
          "size": 222211376,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 450877564,
          "name": "codex-app-server-aarch64-pc-windows-msvc.exe.tar.gz",
          "size": 82131995,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877554,
          "name": "codex-app-server-aarch64-pc-windows-msvc.exe.zip",
          "size": 79889115,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877562,
          "name": "codex-app-server-aarch64-pc-windows-msvc.exe.zst",
          "size": 60888614,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877511,
          "name": "codex-app-server-aarch64-unknown-linux-musl.sigstore",
          "size": 8585,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877516,
          "name": "codex-app-server-aarch64-unknown-linux-musl.tar.gz",
          "size": 79470660,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877496,
          "name": "codex-app-server-aarch64-unknown-linux-musl.zst",
          "size": 57123074,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-aarch64-unknown-linux-musl.zst"
        },
        {
          "id": 450877563,
          "name": "codex-app-server-package-aarch64-apple-darwin.tar.gz",
          "size": 78138938,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877566,
          "name": "codex-app-server-package-aarch64-apple-darwin.tar.zst",
          "size": 56003901,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-apple-darwin.tar.zst"
        },
        {
          "id": 450877544,
          "name": "codex-app-server-package-aarch64-pc-windows-msvc.tar.gz",
          "size": 87100852,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877561,
          "name": "codex-app-server-package-aarch64-pc-windows-msvc.tar.zst",
          "size": 64866909,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-pc-windows-msvc.tar.zst"
        },
        {
          "id": 450877505,
          "name": "codex-app-server-package-aarch64-unknown-linux-musl.tar.gz",
          "size": 81618128,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877508,
          "name": "codex-app-server-package-aarch64-unknown-linux-musl.tar.zst",
          "size": 59102568,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-aarch64-unknown-linux-musl.tar.zst"
        },
        {
          "id": 450877478,
          "name": "codex-app-server-package-x86_64-apple-darwin.tar.gz",
          "size": 84936372,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877474,
          "name": "codex-app-server-package-x86_64-apple-darwin.tar.zst",
          "size": 61386352,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-apple-darwin.tar.zst"
        },
        {
          "id": 450877480,
          "name": "codex-app-server-package-x86_64-pc-windows-msvc.tar.gz",
          "size": 93854418,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877479,
          "name": "codex-app-server-package-x86_64-pc-windows-msvc.tar.zst",
          "size": 69962926,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-pc-windows-msvc.tar.zst"
        },
        {
          "id": 450877439,
          "name": "codex-app-server-package-x86_64-unknown-linux-musl.tar.gz",
          "size": 87847349,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877434,
          "name": "codex-app-server-package-x86_64-unknown-linux-musl.tar.zst",
          "size": 63620306,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-package-x86_64-unknown-linux-musl.tar.zst"
        },
        {
          "id": 450877466,
          "name": "codex-app-server-x86_64-apple-darwin.tar.gz",
          "size": 83185884,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877485,
          "name": "codex-app-server-x86_64-apple-darwin.zst",
          "size": 59596647,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-apple-darwin.zst"
        },
        {
          "id": 450877469,
          "name": "codex-app-server-x86_64-pc-windows-msvc.exe",
          "size": 257201456,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 450877492,
          "name": "codex-app-server-x86_64-pc-windows-msvc.exe.tar.gz",
          "size": 88849963,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877472,
          "name": "codex-app-server-x86_64-pc-windows-msvc.exe.zip",
          "size": 86053077,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877468,
          "name": "codex-app-server-x86_64-pc-windows-msvc.exe.zst",
          "size": 65670419,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877429,
          "name": "codex-app-server-x86_64-unknown-linux-musl.sigstore",
          "size": 8585,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877427,
          "name": "codex-app-server-x86_64-unknown-linux-musl.tar.gz",
          "size": 85664390,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877431,
          "name": "codex-app-server-x86_64-unknown-linux-musl.zst",
          "size": 61306294,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-app-server-x86_64-unknown-linux-musl.zst"
        },
        {
          "id": 450878849,
          "name": "codex-command-runner",
          "size": 1338,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner"
        },
        {
          "id": 450877540,
          "name": "codex-command-runner-aarch64-pc-windows-msvc.exe",
          "size": 1107760,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 450877553,
          "name": "codex-command-runner-aarch64-pc-windows-msvc.exe.tar.gz",
          "size": 486082,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-aarch64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877530,
          "name": "codex-command-runner-aarch64-pc-windows-msvc.exe.zip",
          "size": 470860,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-aarch64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877536,
          "name": "codex-command-runner-aarch64-pc-windows-msvc.exe.zst",
          "size": 407559,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-aarch64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877461,
          "name": "codex-command-runner-x86_64-pc-windows-msvc.exe",
          "size": 1284912,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 450877460,
          "name": "codex-command-runner-x86_64-pc-windows-msvc.exe.tar.gz",
          "size": 552040,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-x86_64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877465,
          "name": "codex-command-runner-x86_64-pc-windows-msvc.exe.zip",
          "size": 534059,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-x86_64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877463,
          "name": "codex-command-runner-x86_64-pc-windows-msvc.exe.zst",
          "size": 468106,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-command-runner-x86_64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877499,
          "name": "codex-npm-0.141.0.tgz",
          "size": 3890,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-0.141.0.tgz"
        },
        {
          "id": 450877501,
          "name": "codex-npm-darwin-arm64-0.141.0.tgz",
          "size": 96064204,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-darwin-arm64-0.141.0.tgz"
        },
        {
          "id": 450877498,
          "name": "codex-npm-darwin-x64-0.141.0.tgz",
          "size": 102804901,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-darwin-x64-0.141.0.tgz"
        },
        {
          "id": 450877507,
          "name": "codex-npm-linux-arm64-0.141.0.tgz",
          "size": 99670089,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-linux-arm64-0.141.0.tgz"
        },
        {
          "id": 450877520,
          "name": "codex-npm-linux-x64-0.141.0.tgz",
          "size": 106156345,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-linux-x64-0.141.0.tgz"
        },
        {
          "id": 450877513,
          "name": "codex-npm-win32-arm64-0.141.0.tgz",
          "size": 106953821,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-win32-arm64-0.141.0.tgz"
        },
        {
          "id": 450877486,
          "name": "codex-npm-win32-x64-0.141.0.tgz",
          "size": 114723973,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-npm-win32-x64-0.141.0.tgz"
        },
        {
          "id": 450877545,
          "name": "codex-package-aarch64-apple-darwin.tar.gz",
          "size": 92659050,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877546,
          "name": "codex-package-aarch64-apple-darwin.tar.zst",
          "size": 66815481,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-apple-darwin.tar.zst"
        },
        {
          "id": 450877528,
          "name": "codex-package-aarch64-pc-windows-msvc.tar.gz",
          "size": 102090353,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877541,
          "name": "codex-package-aarch64-pc-windows-msvc.tar.zst",
          "size": 76336579,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-pc-windows-msvc.tar.zst"
        },
        {
          "id": 450877529,
          "name": "codex-package-aarch64-unknown-linux-musl.tar.gz",
          "size": 96001115,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877537,
          "name": "codex-package-aarch64-unknown-linux-musl.tar.zst",
          "size": 69945804,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-aarch64-unknown-linux-musl.tar.zst"
        },
        {
          "id": 450877493,
          "name": "codex-package-x86_64-apple-darwin.tar.gz",
          "size": 100779581,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877476,
          "name": "codex-package-x86_64-apple-darwin.tar.zst",
          "size": 73174113,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-apple-darwin.tar.zst"
        },
        {
          "id": 450877464,
          "name": "codex-package-x86_64-pc-windows-msvc.tar.gz",
          "size": 110346126,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877467,
          "name": "codex-package-x86_64-pc-windows-msvc.tar.zst",
          "size": 82125037,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-pc-windows-msvc.tar.zst"
        },
        {
          "id": 450877454,
          "name": "codex-package-x86_64-unknown-linux-musl.tar.gz",
          "size": 103644117,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877443,
          "name": "codex-package-x86_64-unknown-linux-musl.tar.zst",
          "size": 75158151,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package-x86_64-unknown-linux-musl.tar.zst"
        },
        {
          "id": 450877425,
          "name": "codex-package_SHA256SUMS",
          "size": 1392,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-package_SHA256SUMS"
        },
        {
          "id": 450878810,
          "name": "codex-responses-api-proxy",
          "size": 3893,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy"
        },
        {
          "id": 450877551,
          "name": "codex-responses-api-proxy-aarch64-apple-darwin.tar.gz",
          "size": 2370052,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877548,
          "name": "codex-responses-api-proxy-aarch64-apple-darwin.zst",
          "size": 1901951,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-apple-darwin.zst"
        },
        {
          "id": 450877539,
          "name": "codex-responses-api-proxy-aarch64-pc-windows-msvc.exe",
          "size": 5227312,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 450877542,
          "name": "codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.tar.gz",
          "size": 2327600,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877534,
          "name": "codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.zip",
          "size": 2268696,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877538,
          "name": "codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.zst",
          "size": 1897971,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877518,
          "name": "codex-responses-api-proxy-aarch64-unknown-linux-musl.sigstore",
          "size": 8565,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877522,
          "name": "codex-responses-api-proxy-aarch64-unknown-linux-musl.tar.gz",
          "size": 4513608,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877524,
          "name": "codex-responses-api-proxy-aarch64-unknown-linux-musl.zst",
          "size": 3843988,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-aarch64-unknown-linux-musl.zst"
        },
        {
          "id": 450877483,
          "name": "codex-responses-api-proxy-npm-0.141.0.tgz",
          "size": 19275174,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-npm-0.141.0.tgz"
        },
        {
          "id": 450877484,
          "name": "codex-responses-api-proxy-x86_64-apple-darwin.tar.gz",
          "size": 2555210,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877473,
          "name": "codex-responses-api-proxy-x86_64-apple-darwin.zst",
          "size": 2055889,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-apple-darwin.zst"
        },
        {
          "id": 450877462,
          "name": "codex-responses-api-proxy-x86_64-pc-windows-msvc.exe",
          "size": 5944112,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 450877470,
          "name": "codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.tar.gz",
          "size": 2489021,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877452,
          "name": "codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.zip",
          "size": 2418679,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877447,
          "name": "codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.zst",
          "size": 2029380,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877459,
          "name": "codex-responses-api-proxy-x86_64-unknown-linux-musl.sigstore",
          "size": 8565,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877446,
          "name": "codex-responses-api-proxy-x86_64-unknown-linux-musl.tar.gz",
          "size": 4510642,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877448,
          "name": "codex-responses-api-proxy-x86_64-unknown-linux-musl.zst",
          "size": 3544638,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-responses-api-proxy-x86_64-unknown-linux-musl.zst"
        },
        {
          "id": 450877490,
          "name": "codex-sdk-npm-0.141.0.tgz",
          "size": 20575,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-sdk-npm-0.141.0.tgz"
        },
        {
          "id": 450877543,
          "name": "codex-symbols-aarch64-apple-darwin-app-server.tar.gz",
          "size": 191688291,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-aarch64-apple-darwin-app-server.tar.gz"
        },
        {
          "id": 450877555,
          "name": "codex-symbols-aarch64-apple-darwin.tar.gz",
          "size": 252344492,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877521,
          "name": "codex-symbols-aarch64-pc-windows-msvc.tar.gz",
          "size": 392601350,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-aarch64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877510,
          "name": "codex-symbols-aarch64-unknown-linux-musl-app-server.tar.gz",
          "size": 158308512,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-aarch64-unknown-linux-musl-app-server.tar.gz"
        },
        {
          "id": 450877517,
          "name": "codex-symbols-aarch64-unknown-linux-musl.tar.gz",
          "size": 207579669,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877482,
          "name": "codex-symbols-x86_64-apple-darwin-app-server.tar.gz",
          "size": 195447707,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-x86_64-apple-darwin-app-server.tar.gz"
        },
        {
          "id": 450877475,
          "name": "codex-symbols-x86_64-apple-darwin.tar.gz",
          "size": 257059337,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877449,
          "name": "codex-symbols-x86_64-pc-windows-msvc.tar.gz",
          "size": 403590792,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-x86_64-pc-windows-msvc.tar.gz"
        },
        {
          "id": 450877435,
          "name": "codex-symbols-x86_64-unknown-linux-musl-app-server.tar.gz",
          "size": 152984317,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-x86_64-unknown-linux-musl-app-server.tar.gz"
        },
        {
          "id": 450877430,
          "name": "codex-symbols-x86_64-unknown-linux-musl.tar.gz",
          "size": 201093265,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-symbols-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450878865,
          "name": "codex-windows-sandbox-setup",
          "size": 1389,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup"
        },
        {
          "id": 450877526,
          "name": "codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe",
          "size": 7768880,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe"
        },
        {
          "id": 450877531,
          "name": "codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.tar.gz",
          "size": 3254823,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877527,
          "name": "codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.zip",
          "size": 3171158,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877535,
          "name": "codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.zst",
          "size": 2534534,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-aarch64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877453,
          "name": "codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe",
          "size": 8841008,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 450877457,
          "name": "codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.tar.gz",
          "size": 3500353,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877455,
          "name": "codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.zip",
          "size": 3400373,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877450,
          "name": "codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.zst",
          "size": 2721025,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-windows-sandbox-setup-x86_64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877471,
          "name": "codex-x86_64-apple-darwin.dmg",
          "size": 114074376,
          "content_type": "application/x-apple-diskimage",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-apple-darwin.dmg"
        },
        {
          "id": 450877487,
          "name": "codex-x86_64-apple-darwin.tar.gz",
          "size": 99133997,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877489,
          "name": "codex-x86_64-apple-darwin.zst",
          "size": 71389535,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-apple-darwin.zst"
        },
        {
          "id": 450877458,
          "name": "codex-x86_64-pc-windows-msvc.exe",
          "size": 313418032,
          "content_type": "application/x-msdos-program",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-pc-windows-msvc.exe"
        },
        {
          "id": 450877456,
          "name": "codex-x86_64-pc-windows-msvc.exe.tar.gz",
          "size": 105543353,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-pc-windows-msvc.exe.tar.gz"
        },
        {
          "id": 450877437,
          "name": "codex-x86_64-pc-windows-msvc.exe.zip",
          "size": 106200962,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-pc-windows-msvc.exe.zip"
        },
        {
          "id": 450877451,
          "name": "codex-x86_64-pc-windows-msvc.exe.zst",
          "size": 77826431,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-pc-windows-msvc.exe.zst"
        },
        {
          "id": 450877440,
          "name": "codex-x86_64-unknown-linux-musl-bundle.tar.zst",
          "size": 73071798,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-unknown-linux-musl-bundle.tar.zst"
        },
        {
          "id": 450877433,
          "name": "codex-x86_64-unknown-linux-musl.sigstore",
          "size": 8565,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-unknown-linux-musl.sigstore"
        },
        {
          "id": 450877436,
          "name": "codex-x86_64-unknown-linux-musl.tar.gz",
          "size": 101616661,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877441,
          "name": "codex-x86_64-unknown-linux-musl.zst",
          "size": 72916806,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-x86_64-unknown-linux-musl.zst"
        },
        {
          "id": 450878890,
          "name": "codex-zsh",
          "size": 2462,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-zsh"
        },
        {
          "id": 450877502,
          "name": "codex-zsh-aarch64-apple-darwin.tar.gz",
          "size": 358774,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-zsh-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 450877500,
          "name": "codex-zsh-aarch64-unknown-linux-musl.tar.gz",
          "size": 411652,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-zsh-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877506,
          "name": "codex-zsh-x86_64-apple-darwin.tar.gz",
          "size": 391162,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-zsh-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 450877497,
          "name": "codex-zsh-x86_64-unknown-linux-musl.tar.gz",
          "size": 433406,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/codex-zsh-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 450877426,
          "name": "config-schema.json",
          "size": 154036,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/config-schema.json"
        },
        {
          "id": 450877428,
          "name": "install.ps1",
          "size": 29883,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/install.ps1"
        },
        {
          "id": 450877432,
          "name": "install.sh",
          "size": 21658,
          "content_type": "application/x-sh",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/install.sh"
        },
        {
          "id": 450877495,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-macosx_10_9_x86_64.whl",
          "size": 101319028,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-macosx_10_9_x86_64.whl"
        },
        {
          "id": 450877488,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-macosx_11_0_arm64.whl",
          "size": 92959919,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-macosx_11_0_arm64.whl"
        },
        {
          "id": 450877491,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-manylinux_2_17_aarch64.whl",
          "size": 96290248,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-manylinux_2_17_aarch64.whl"
        },
        {
          "id": 450877477,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-manylinux_2_17_x86_64.whl",
          "size": 104322300,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-manylinux_2_17_x86_64.whl"
        },
        {
          "id": 450877494,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-win_amd64.whl",
          "size": 111082406,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-win_amd64.whl"
        },
        {
          "id": 450877481,
          "name": "openai_codex_cli_bin-0.141.0-py3-none-win_arm64.whl",
          "size": 102374378,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/openai/codex/releases/download/rust-v0.141.0/openai_codex_cli_bin-0.141.0-py3-none-win_arm64.whl"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "codex": "codex-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "codex": "codex-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "codex": "codex-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "codex": "codex-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Orange-OpenSource/hurl",
      "version": "8.0.1"
    },
    "release": {
      "tag_name": "8.0.1",
      "assets": [
        {
          "id": 407509621,
          "name": "hurl-8.0.1-aarch64-apple-darwin.tar.gz",
          "size": 2786095,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 407509624,
          "name": "hurl-8.0.1-aarch64-apple-darwin.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-aarch64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 407509616,
          "name": "hurl-8.0.1-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3014437,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 407509618,
          "name": "hurl-8.0.1-aarch64-unknown-linux-gnu.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-aarch64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 407509619,
          "name": "hurl-8.0.1-x86_64-apple-darwin.tar.gz",
          "size": 3062493,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 407509620,
          "name": "hurl-8.0.1-x86_64-apple-darwin.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 407509629,
          "name": "hurl-8.0.1-x86_64-pc-windows-msvc-installer.exe",
          "size": 4918991,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-pc-windows-msvc-installer.exe"
        },
        {
          "id": 407509630,
          "name": "hurl-8.0.1-x86_64-pc-windows-msvc-installer.exe.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-pc-windows-msvc-installer.exe.sha256"
        },
        {
          "id": 407509632,
          "name": "hurl-8.0.1-x86_64-pc-windows-msvc.zip",
          "size": 4728872,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 407509636,
          "name": "hurl-8.0.1-x86_64-pc-windows-msvc.zip.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 407509607,
          "name": "hurl-8.0.1-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3211204,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 407509614,
          "name": "hurl-8.0.1-x86_64-unknown-linux-gnu.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl-8.0.1-x86_64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 407509609,
          "name": "hurl_8.0.1_amd64.deb",
          "size": 2058046,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl_8.0.1_amd64.deb"
        },
        {
          "id": 407509608,
          "name": "hurl_8.0.1_amd64.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl_8.0.1_amd64.deb.sha256"
        },
        {
          "id": 407509611,
          "name": "hurl_8.0.1_arm64.deb",
          "size": 1960338,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl_8.0.1_arm64.deb"
        },
        {
          "id": 407509610,
          "name": "hurl_8.0.1_arm64.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/Orange-OpenSource/hurl/releases/download/8.0.1/hurl_8.0.1_arm64.deb.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "hurl": "hurl-8.0.1-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "hurl": "hurl-8.0.1-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "hurl": "hurl-8.0.1-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "hurl": "hurl-8.0.1-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "oven-sh/bun",
      "version": "bun-v1.3.14"
    },
    "release": {
      "tag_name": "bun-v1.3.14",
      "assets": [
        {
          "id": 418773679,
          "name": "bun-darwin-aarch64-profile.zip",
          "size": 301012416,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-aarch64-profile.zip"
        },
        {
          "id": 418774455,
          "name": "bun-darwin-aarch64.zip",
          "size": 23586433,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-aarch64.zip"
        },
        {
          "id": 418774149,
          "name": "bun-darwin-x64-baseline-profile.zip",
          "size": 312642364,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-x64-baseline-profile.zip"
        },
        {
          "id": 418773915,
          "name": "bun-darwin-x64-baseline.zip",
          "size": 26509145,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-x64-baseline.zip"
        },
        {
          "id": 418775294,
          "name": "bun-darwin-x64-profile.zip",
          "size": 312642274,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-x64-profile.zip"
        },
        {
          "id": 418774587,
          "name": "bun-darwin-x64.zip",
          "size": 26509109,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-darwin-x64.zip"
        },
        {
          "id": 418775020,
          "name": "bun-freebsd-aarch64-profile.zip",
          "size": 169220344,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-aarch64-profile.zip"
        },
        {
          "id": 418774549,
          "name": "bun-freebsd-aarch64.zip",
          "size": 35255742,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-aarch64.zip"
        },
        {
          "id": 418774665,
          "name": "bun-freebsd-x64-baseline-profile.zip",
          "size": 171601492,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-x64-baseline-profile.zip"
        },
        {
          "id": 418773680,
          "name": "bun-freebsd-x64-baseline.zip",
          "size": 35829402,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-x64-baseline.zip"
        },
        {
          "id": 418775213,
          "name": "bun-freebsd-x64-profile.zip",
          "size": 171601546,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-x64-profile.zip"
        },
        {
          "id": 418775092,
          "name": "bun-freebsd-x64.zip",
          "size": 35829438,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-freebsd-x64.zip"
        },
        {
          "id": 418775060,
          "name": "bun-linux-aarch64-android-profile.zip",
          "size": 274932074,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-android-profile.zip"
        },
        {
          "id": 418775021,
          "name": "bun-linux-aarch64-android.zip",
          "size": 34926314,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-android.zip"
        },
        {
          "id": 418775283,
          "name": "bun-linux-aarch64-musl-profile.zip",
          "size": 178662774,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-musl-profile.zip"
        },
        {
          "id": 418773678,
          "name": "bun-linux-aarch64-musl.zip",
          "size": 34304457,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-musl.zip"
        },
        {
          "id": 418774478,
          "name": "bun-linux-aarch64-profile.zip",
          "size": 195488180,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64-profile.zip"
        },
        {
          "id": 418773677,
          "name": "bun-linux-aarch64.zip",
          "size": 35700603,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-aarch64.zip"
        },
        {
          "id": 418773917,
          "name": "bun-linux-x64-android-baseline-profile.zip",
          "size": 274393066,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-android-baseline-profile.zip"
        },
        {
          "id": 418774608,
          "name": "bun-linux-x64-android-baseline.zip",
          "size": 35807489,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-android-baseline.zip"
        },
        {
          "id": 418774710,
          "name": "bun-linux-x64-android-profile.zip",
          "size": 274393138,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-android-profile.zip"
        },
        {
          "id": 418775302,
          "name": "bun-linux-x64-android.zip",
          "size": 35807525,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-android.zip"
        },
        {
          "id": 418774671,
          "name": "bun-linux-x64-baseline-profile.zip",
          "size": 200358449,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-baseline-profile.zip"
        },
        {
          "id": 418774976,
          "name": "bun-linux-x64-baseline.zip",
          "size": 35595658,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-baseline.zip"
        },
        {
          "id": 418773672,
          "name": "bun-linux-x64-musl-baseline-profile.zip",
          "size": 181870880,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-musl-baseline-profile.zip"
        },
        {
          "id": 418774475,
          "name": "bun-linux-x64-musl-baseline.zip",
          "size": 34384861,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-musl-baseline.zip"
        },
        {
          "id": 418774956,
          "name": "bun-linux-x64-musl-profile.zip",
          "size": 181951037,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-musl-profile.zip"
        },
        {
          "id": 418774605,
          "name": "bun-linux-x64-musl.zip",
          "size": 34669122,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-musl.zip"
        },
        {
          "id": 418773912,
          "name": "bun-linux-x64-profile.zip",
          "size": 201016139,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64-profile.zip"
        },
        {
          "id": 418773972,
          "name": "bun-linux-x64.zip",
          "size": 35969274,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64.zip"
        },
        {
          "id": 418774725,
          "name": "bun-windows-aarch64-profile.zip",
          "size": 152529157,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-aarch64-profile.zip"
        },
        {
          "id": 418774029,
          "name": "bun-windows-aarch64.zip",
          "size": 36659109,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-aarch64.zip"
        },
        {
          "id": 418775019,
          "name": "bun-windows-x64-baseline-profile.zip",
          "size": 161325590,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-x64-baseline-profile.zip"
        },
        {
          "id": 418774449,
          "name": "bun-windows-x64-baseline.zip",
          "size": 38023440,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-x64-baseline.zip"
        },
        {
          "id": 418774509,
          "name": "bun-windows-x64-profile.zip",
          "size": 161538064,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-x64-profile.zip"
        },
        {
          "id": 418775198,
          "name": "bun-windows-x64.zip",
          "size": 38366737,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-windows-x64.zip"
        },
        {
          "id": 418956640,
          "name": "SHASUMS256.txt",
          "size": 3431,
          "content_type": "text/plain;charset=utf-8",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/SHASUMS256.txt"
        },
        {
          "id": 418956648,
          "name": "SHASUMS256.txt.asc",
          "size": 3709,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/SHASUMS256.txt.asc"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "bun": "bun-linux-x64.zip"
      },
      "linux-arm64": {
        "bun": "bun-linux-aarch64.zip"
      },
      "darwin-x64": {
        "bun": "bun-darwin-x64.zip"
      },
      "darwin-arm64": {
        "bun": "bun-darwin-aarch64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "oxyno-zeta/s3-proxy"
    },
    "release": {
      "tag_name": "v5.1.0",
      "assets": [
        {
          "id": 412928817,
          "name": "checksums.txt",
          "size": 1412,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/checksums.txt"
        },
        {
          "id": 412928739,
          "name": "s3-proxy_5.1.0_darwin_amd64.tar.gz",
          "size": 16827887,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_darwin_amd64.tar.gz"
        },
        {
          "id": 412928755,
          "name": "s3-proxy_5.1.0_darwin_amd64v2.tar.gz",
          "size": 16823352,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_darwin_amd64v2.tar.gz"
        },
        {
          "id": 412928687,
          "name": "s3-proxy_5.1.0_darwin_amd64v3.tar.gz",
          "size": 16806809,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_darwin_amd64v3.tar.gz"
        },
        {
          "id": 412928707,
          "name": "s3-proxy_5.1.0_darwin_arm64.tar.gz",
          "size": 15785203,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_darwin_arm64.tar.gz"
        },
        {
          "id": 412928706,
          "name": "s3-proxy_5.1.0_linux_amd64.tar.gz",
          "size": 16204513,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_amd64.tar.gz"
        },
        {
          "id": 412928723,
          "name": "s3-proxy_5.1.0_linux_amd64v2.tar.gz",
          "size": 16199586,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_amd64v2.tar.gz"
        },
        {
          "id": 412928764,
          "name": "s3-proxy_5.1.0_linux_amd64v3.tar.gz",
          "size": 16187595,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_amd64v3.tar.gz"
        },
        {
          "id": 412928800,
          "name": "s3-proxy_5.1.0_linux_arm64.tar.gz",
          "size": 14824634,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_arm64.tar.gz"
        },
        {
          "id": 412928781,
          "name": "s3-proxy_5.1.0_linux_armv6.tar.gz",
          "size": 15304359,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_armv6.tar.gz"
        },
        {
          "id": 412928787,
          "name": "s3-proxy_5.1.0_linux_armv7.tar.gz",
          "size": 15289255,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_linux_armv7.tar.gz"
        },
        {
          "id": 412928686,
          "name": "s3-proxy_5.1.0_windows_amd64.zip",
          "size": 16488285,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_windows_amd64.zip"
        },
        {
          "id": 412928807,
          "name": "s3-proxy_5.1.0_windows_amd64v2.zip",
          "size": 16484310,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_windows_amd64v2.zip"
        },
        {
          "id": 412928727,
          "name": "s3-proxy_5.1.0_windows_amd64v3.zip",
          "size": 16474828,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_windows_amd64v3.zip"
        },
        {
          "id": 412928736,
          "name": "s3-proxy_5.1.0_windows_arm64.zip",
          "size": 14967055,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/oxyno-zeta/s3-proxy/releases/download/v5.1.0/s3-proxy_5.1.0_windows_arm64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "s3-proxy": "s3-proxy_5.1.0_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "s3-proxy": "s3-proxy_5.1.0_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "s3-proxy": "s3-proxy_5.1.0_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "s3-proxy": "s3-proxy_5.1.0_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "pnpm/pnpm",
      "version": "v11.8.0"
    },
    "release": {
      "tag_name": "v11.8.0",
      "assets": [
        {
          "id": 451113105,
          "name": "pnpm-darwin-arm64.tar.gz",
          "size": 48723859,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-darwin-arm64.tar.gz"
        },
        {
          "id": 451113101,
          "name": "pnpm-linux-arm64-musl.tar.gz",
          "size": 53430948,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-linux-arm64-musl.tar.gz"
        },
        {
          "id": 451113106,
          "name": "pnpm-linux-arm64.tar.gz",
          "size": 51182143,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-linux-arm64.tar.gz"
        },
        {
          "id": 451113103,
          "name": "pnpm-linux-x64-musl.tar.gz",
          "size": 52877737,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-linux-x64-musl.tar.gz"
        },
        {
          "id": 451113102,
          "name": "pnpm-linux-x64.tar.gz",
          "size": 50907011,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-linux-x64.tar.gz"
        },
        {
          "id": 451113100,
          "name": "pnpm-win32-arm64.zip",
          "size": 36707715,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-win32-arm64.zip"
        },
        {
          "id": 451113107,
          "name": "pnpm-win32-x64.zip",
          "size": 40741864,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/pnpm-win32-x64.zip"
        },
        {
          "id": 451113104,
          "name": "source-maps.tgz",
          "size": 5660277,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/pnpm/pnpm/releases/download/v11.8.0/source-maps.tgz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "pnpm": "pnpm-linux-x64.tar.gz"
      },
      "linux-arm64": {
        "pnpm": "pnpm-linux-arm64.tar.gz"
      },
      "darwin-x64": {
        "pnpm": null
      },
      "darwin-arm64": {
        "pnpm": "pnpm-darwin-arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "raaymax/lazytail",
      "version": "v0.10.0"
    },
    "release": {
      "tag_name": "v0.10.0",
      "assets": [
        {
          "id": 392443676,
          "name": "lazytail-linux-x86_64.tar.gz",
          "size": 4768571,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/raaymax/lazytail/releases/download/v0.10.0/lazytail-linux-x86_64.tar.gz"
        },
        {
          "id": 392443995,
          "name": "lazytail-macos-aarch64.tar.gz",
          "size": 4285042,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/raaymax/lazytail/releases/download/v0.10.0/lazytail-macos-aarch64.tar.gz"
        },
        {
          "id": 392444833,
          "name": "lazytail-macos-x86_64.tar.gz",
          "size": 4529395,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/raaymax/lazytail/releases/download/v0.10.0/lazytail-macos-x86_64.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "lazytail": "lazytail-linux-x86_64.tar.gz"
      },
      "linux-arm64": {
        "lazytail": null
      },
      "darwin-x64": {
        "lazytail": "lazytail-macos-x86_64.tar.gz"
      },
      "darwin-arm64": {
        "lazytail": "lazytail-macos-aarch64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "runmedev/runme"
    },
    "release": {
      "tag_name": "v3.16.11",
      "assets": [
        {
          "id": 408609246,
          "name": "checksums.txt",
          "size": 1167,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/checksums.txt"
        },
        {
          "id": 408609202,
          "name": "runme_darwin_arm64.tar.gz",
          "size": 17609011,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_darwin_arm64.tar.gz"
        },
        {
          "id": 408609220,
          "name": "runme_darwin_x86_64.tar.gz",
          "size": 18919598,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_darwin_x86_64.tar.gz"
        },
        {
          "id": 408609203,
          "name": "runme_js_wasm.tar.gz",
          "size": 2421917,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_js_wasm.tar.gz"
        },
        {
          "id": 408609222,
          "name": "runme_linux_arm64.apk",
          "size": 17332835,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_arm64.apk"
        },
        {
          "id": 408609239,
          "name": "runme_linux_arm64.deb",
          "size": 16772042,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_arm64.deb"
        },
        {
          "id": 408609234,
          "name": "runme_linux_arm64.rpm",
          "size": 17343840,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_arm64.rpm"
        },
        {
          "id": 408609218,
          "name": "runme_linux_arm64.tar.gz",
          "size": 16706951,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_arm64.tar.gz"
        },
        {
          "id": 408609230,
          "name": "runme_linux_x86_64.apk",
          "size": 19212759,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_x86_64.apk"
        },
        {
          "id": 408609245,
          "name": "runme_linux_x86_64.deb",
          "size": 18493372,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_x86_64.deb"
        },
        {
          "id": 408609235,
          "name": "runme_linux_x86_64.rpm",
          "size": 19215768,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_x86_64.rpm"
        },
        {
          "id": 408609208,
          "name": "runme_linux_x86_64.tar.gz",
          "size": 18426985,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_linux_x86_64.tar.gz"
        },
        {
          "id": 408609201,
          "name": "runme_windows_arm64.zip",
          "size": 16866303,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_windows_arm64.zip"
        },
        {
          "id": 408609200,
          "name": "runme_windows_x86_64.zip",
          "size": 18927376,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/runmedev/runme/releases/download/v3.16.11/runme_windows_x86_64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "runme": "runme_linux_x86_64.tar.gz"
      },
      "linux-arm64": {
        "runme": "runme_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "runme": "runme_darwin_x86_64.tar.gz"
      },
      "darwin-arm64": {
        "runme": "runme_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "sachaos/viddy"
    },
    "release": {
      "tag_name": "v1.3.1",
      "assets": [
        {
          "id": 447334572,
          "name": "viddy-v1.3.1-linux-arm64.sha256",
          "size": 98,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-arm64.sha256"
        },
        {
          "id": 447334573,
          "name": "viddy-v1.3.1-linux-arm64.tar.gz",
          "size": 4011615,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-arm64.tar.gz"
        },
        {
          "id": 447334649,
          "name": "viddy-v1.3.1-linux-i686.sha256",
          "size": 97,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-i686.sha256"
        },
        {
          "id": 447334650,
          "name": "viddy-v1.3.1-linux-i686.tar.gz",
          "size": 3714305,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-i686.tar.gz"
        },
        {
          "id": 447334544,
          "name": "viddy-v1.3.1-linux-x86_64.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-x86_64.sha256"
        },
        {
          "id": 447334545,
          "name": "viddy-v1.3.1-linux-x86_64.tar.gz",
          "size": 3623684,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-linux-x86_64.tar.gz"
        },
        {
          "id": 447333783,
          "name": "viddy-v1.3.1-macos-arm64.sha256",
          "size": 98,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-macos-arm64.sha256"
        },
        {
          "id": 447333781,
          "name": "viddy-v1.3.1-macos-arm64.tar.gz",
          "size": 3221432,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-macos-arm64.tar.gz"
        },
        {
          "id": 447333936,
          "name": "viddy-v1.3.1-macos-x86_64.sha256",
          "size": 99,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-macos-x86_64.sha256"
        },
        {
          "id": 447333937,
          "name": "viddy-v1.3.1-macos-x86_64.tar.gz",
          "size": 3403416,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-macos-x86_64.tar.gz"
        },
        {
          "id": 447334766,
          "name": "viddy-v1.3.1-windows-x86_64.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-windows-x86_64.sha256"
        },
        {
          "id": 447334767,
          "name": "viddy-v1.3.1-windows-x86_64.tar.gz",
          "size": 3204629,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sachaos/viddy/releases/download/v1.3.1/viddy-v1.3.1-windows-x86_64.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "viddy": "viddy-v1.3.1-linux-x86_64.tar.gz"
      },
      "linux-arm64": {
        "viddy": "viddy-v1.3.1-linux-arm64.tar.gz"
      },
      "darwin-x64": {
        "viddy": "viddy-v1.3.1-macos-x86_64.tar.gz"
      },
      "darwin-arm64": {
        "viddy": "viddy-v1.3.1-macos-arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Schniz/fnm"
    },
    "release": {
      "tag_name": "v1.39.0",
      "assets": [
        {
          "id": 368341228,
          "name": "fnm-arm32.zip",
          "size": 3446327,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-arm32.zip"
        },
        {
          "id": 368341206,
          "name": "fnm-arm64.zip",
          "size": 3685524,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-arm64.zip"
        },
        {
          "id": 368341191,
          "name": "fnm-linux.zip",
          "size": 3360953,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-linux.zip"
        },
        {
          "id": 368341149,
          "name": "fnm-macos.zip",
          "size": 6268849,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-macos.zip"
        },
        {
          "id": 368341124,
          "name": "fnm-windows.zip",
          "size": 3420688,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-windows.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "fnm": "fnm-linux.zip"
      },
      "linux-arm64": {
        "fnm": "fnm-linux.zip"
      },
      "darwin-x64": {
        "fnm": "fnm-macos.zip"
      },
      "darwin-arm64": {
        "fnm": "fnm-macos.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "sharkdp/bat",
      "version": "v0.26.1"
    },
    "release": {
      "tag_name": "v0.26.1",
      "assets": [
        {
          "id": 323548151,
          "name": "bat-musl_0.26.1_arm64.deb",
          "size": 2910138,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-musl_0.26.1_arm64.deb"
        },
        {
          "id": 323549428,
          "name": "bat-musl_0.26.1_musl-linux-amd64.deb",
          "size": 3074590,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-musl_0.26.1_musl-linux-amd64.deb"
        },
        {
          "id": 323549111,
          "name": "bat-musl_0.26.1_musl-linux-i686.deb",
          "size": 3071596,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-musl_0.26.1_musl-linux-i686.deb"
        },
        {
          "id": 323548442,
          "name": "bat-v0.26.1-aarch64-apple-darwin.tar.gz",
          "size": 3216703,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 323548313,
          "name": "bat-v0.26.1-aarch64-pc-windows-msvc.zip",
          "size": 3434291,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 323548647,
          "name": "bat-v0.26.1-aarch64-unknown-linux-gnu.tar.gz",
          "size": 3345545,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 323548153,
          "name": "bat-v0.26.1-aarch64-unknown-linux-musl.tar.gz",
          "size": 3383478,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 323547994,
          "name": "bat-v0.26.1-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 3380827,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 323548113,
          "name": "bat-v0.26.1-arm-unknown-linux-musleabihf.tar.gz",
          "size": 3407734,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 323549094,
          "name": "bat-v0.26.1-i686-pc-windows-msvc.zip",
          "size": 3367862,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-i686-pc-windows-msvc.zip"
        },
        {
          "id": 323549157,
          "name": "bat-v0.26.1-i686-unknown-linux-gnu.tar.gz",
          "size": 3572280,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 323549112,
          "name": "bat-v0.26.1-i686-unknown-linux-musl.tar.gz",
          "size": 3545941,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 323549786,
          "name": "bat-v0.26.1-x86_64-apple-darwin.tar.gz",
          "size": 3367309,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 323549116,
          "name": "bat-v0.26.1-x86_64-pc-windows-msvc.zip",
          "size": 3613318,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 323549181,
          "name": "bat-v0.26.1-x86_64-unknown-linux-gnu.tar.gz",
          "size": 3546574,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 323549429,
          "name": "bat-v0.26.1-x86_64-unknown-linux-musl.tar.gz",
          "size": 3584928,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 323549182,
          "name": "bat_0.26.1_amd64.deb",
          "size": 3037592,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat_0.26.1_amd64.deb"
        },
        {
          "id": 323548646,
          "name": "bat_0.26.1_arm64.deb",
          "size": 2862796,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat_0.26.1_arm64.deb"
        },
        {
          "id": 323547995,
          "name": "bat_0.26.1_armhf.deb",
          "size": 2908064,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat_0.26.1_armhf.deb"
        },
        {
          "id": 323549158,
          "name": "bat_0.26.1_i686.deb",
          "size": 3087444,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat_0.26.1_i686.deb"
        },
        {
          "id": 323548114,
          "name": "bat_0.26.1_musl-linux-armhf.deb",
          "size": 2929440,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/bat/releases/download/v0.26.1/bat_0.26.1_musl-linux-armhf.deb"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "bat": "bat-v0.26.1-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "bat": "bat-v0.26.1-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "bat": "bat-v0.26.1-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "bat": "bat-v0.26.1-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "sharkdp/fd",
      "version": "v10.4.2"
    },
    "release": {
      "tag_name": "v10.4.2",
      "assets": [
        {
          "id": 370662854,
          "name": "fd-musl_10.4.2_amd64.deb",
          "size": 1444340,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-musl_10.4.2_amd64.deb"
        },
        {
          "id": 370662860,
          "name": "fd-musl_10.4.2_arm64.deb",
          "size": 1324274,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-musl_10.4.2_arm64.deb"
        },
        {
          "id": 370662033,
          "name": "fd-musl_10.4.2_armhf.deb",
          "size": 1200474,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-musl_10.4.2_armhf.deb"
        },
        {
          "id": 370661445,
          "name": "fd-musl_10.4.2_i686.deb",
          "size": 1264540,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-musl_10.4.2_i686.deb"
        },
        {
          "id": 370661116,
          "name": "fd-v10.4.2-aarch64-apple-darwin.tar.gz",
          "size": 1328933,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 370662661,
          "name": "fd-v10.4.2-aarch64-pc-windows-msvc.zip",
          "size": 1370473,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 370663239,
          "name": "fd-v10.4.2-aarch64-unknown-linux-gnu.tar.gz",
          "size": 1559490,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 370662859,
          "name": "fd-v10.4.2-aarch64-unknown-linux-musl.tar.gz",
          "size": 1604562,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 370662960,
          "name": "fd-v10.4.2-arm-unknown-linux-gnueabihf.tar.gz",
          "size": 1594207,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-arm-unknown-linux-gnueabihf.tar.gz"
        },
        {
          "id": 370662032,
          "name": "fd-v10.4.2-arm-unknown-linux-musleabihf.tar.gz",
          "size": 1453576,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 370661802,
          "name": "fd-v10.4.2-i686-pc-windows-msvc.zip",
          "size": 1379740,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-i686-pc-windows-msvc.zip"
        },
        {
          "id": 370661737,
          "name": "fd-v10.4.2-i686-unknown-linux-gnu.tar.gz",
          "size": 1765873,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-i686-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 370661444,
          "name": "fd-v10.4.2-i686-unknown-linux-musl.tar.gz",
          "size": 1514988,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 370661665,
          "name": "fd-v10.4.2-x86_64-pc-windows-gnu.zip",
          "size": 1469143,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-pc-windows-gnu.zip"
        },
        {
          "id": 370661516,
          "name": "fd-v10.4.2-x86_64-pc-windows-msvc.zip",
          "size": 1525898,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 370662118,
          "name": "fd-v10.4.2-x86_64-unknown-linux-gnu.tar.gz",
          "size": 1700779,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 370662855,
          "name": "fd-v10.4.2-x86_64-unknown-linux-musl.tar.gz",
          "size": 1754511,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd-v10.4.2-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 370662117,
          "name": "fd_10.4.2_amd64.deb",
          "size": 1399120,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_amd64.deb"
        },
        {
          "id": 370663240,
          "name": "fd_10.4.2_arm64.deb",
          "size": 1277486,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_arm64.deb"
        },
        {
          "id": 370662959,
          "name": "fd_10.4.2_armhf.deb",
          "size": 1325632,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_armhf.deb"
        },
        {
          "id": 370661738,
          "name": "fd_10.4.2_i686.deb",
          "size": 1474036,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/sharkdp/fd/releases/download/v10.4.2/fd_10.4.2_i686.deb"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "fd": "fd-v10.4.2-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "fd": "fd-v10.4.2-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "fd": null
      },
      "darwin-arm64": {
        "fd": "fd-v10.4.2-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "sigoden/aichat"
    },
    "release": {
      "tag_name": "v0.30.0",
      "assets": [
        {
          "id": 270517467,
          "name": "aichat-v0.30.0-aarch64-apple-darwin.tar.gz",
          "size": 5044993,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 270517672,
          "name": "aichat-v0.30.0-aarch64-pc-windows-msvc.zip",
          "size": 5087866,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 270517450,
          "name": "aichat-v0.30.0-aarch64-unknown-linux-musl.tar.gz",
          "size": 5464580,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 270517429,
          "name": "aichat-v0.30.0-arm-unknown-linux-musleabihf.tar.gz",
          "size": 5158772,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 270517430,
          "name": "aichat-v0.30.0-armv7-unknown-linux-musleabihf.tar.gz",
          "size": 5097936,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 270517623,
          "name": "aichat-v0.30.0-i686-pc-windows-msvc.zip",
          "size": 4815660,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-i686-pc-windows-msvc.zip"
        },
        {
          "id": 270517436,
          "name": "aichat-v0.30.0-i686-unknown-linux-musl.tar.gz",
          "size": 5441627,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 270516945,
          "name": "aichat-v0.30.0-x86_64-apple-darwin.tar.gz",
          "size": 5195911,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 270517633,
          "name": "aichat-v0.30.0-x86_64-pc-windows-msvc.zip",
          "size": 5252563,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 270517432,
          "name": "aichat-v0.30.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 5759120,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/aichat/releases/download/v0.30.0/aichat-v0.30.0-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "aichat": "aichat-v0.30.0-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "aichat": "aichat-v0.30.0-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "aichat": "aichat-v0.30.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "aichat": "aichat-v0.30.0-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "sigoden/dufs",
      "assetHints": {
        "select": "dufs-v0.43.0-x86_64-unknown-linux-musl"
      }
    },
    "release": {
      "tag_name": "v0.43.0",
      "assets": [
        {
          "id": 204230239,
          "name": "dufs-v0.43.0-aarch64-apple-darwin.tar.gz",
          "size": 1700674,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 204230922,
          "name": "dufs-v0.43.0-aarch64-pc-windows-msvc.zip",
          "size": 1703723,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 204230102,
          "name": "dufs-v0.43.0-aarch64-unknown-linux-musl.tar.gz",
          "size": 1937757,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 204230117,
          "name": "dufs-v0.43.0-arm-unknown-linux-musleabihf.tar.gz",
          "size": 1911391,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 204230115,
          "name": "dufs-v0.43.0-armv7-unknown-linux-musleabihf.tar.gz",
          "size": 1876963,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-armv7-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 204231170,
          "name": "dufs-v0.43.0-i686-pc-windows-msvc.zip",
          "size": 1578156,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-i686-pc-windows-msvc.zip"
        },
        {
          "id": 204230128,
          "name": "dufs-v0.43.0-i686-unknown-linux-musl.tar.gz",
          "size": 1909818,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 204229987,
          "name": "dufs-v0.43.0-x86_64-apple-darwin.tar.gz",
          "size": 1934296,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 204230259,
          "name": "dufs-v0.43.0-x86_64-pc-windows-msvc.zip",
          "size": 1780144,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 204230116,
          "name": "dufs-v0.43.0-x86_64-unknown-linux-musl.tar.gz",
          "size": 2096778,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/sigoden/dufs/releases/download/v0.43.0/dufs-v0.43.0-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "dufs": "dufs-v0.43.0-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "dufs": "dufs-v0.43.0-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "dufs": "dufs-v0.43.0-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "dufs": "dufs-v0.43.0-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "sosedoff/pgweb"
    },
    "release": {
      "tag_name": "v0.17.0",
      "assets": [
        {
          "id": 319623592,
          "name": "pgweb_darwin_amd64.zip",
          "size": 6969967,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_darwin_amd64.zip"
        },
        {
          "id": 319623619,
          "name": "pgweb_darwin_arm64.zip",
          "size": 6572917,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_darwin_arm64.zip"
        },
        {
          "id": 319623626,
          "name": "pgweb_linux_amd64.zip",
          "size": 6822856,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_linux_amd64.zip"
        },
        {
          "id": 319623643,
          "name": "pgweb_linux_arm64.zip",
          "size": 6291176,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_linux_arm64.zip"
        },
        {
          "id": 319623638,
          "name": "pgweb_linux_arm64_v7.zip",
          "size": 6291182,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_linux_arm64_v7.zip"
        },
        {
          "id": 319623632,
          "name": "pgweb_linux_arm_v5.zip",
          "size": 6444432,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_linux_arm_v5.zip"
        },
        {
          "id": 319623650,
          "name": "pgweb_windows_amd64.zip",
          "size": 6983325,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/sosedoff/pgweb/releases/download/v0.17.0/pgweb_windows_amd64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "pgweb": "pgweb_linux_amd64.zip"
      },
      "linux-arm64": {
        "pgweb": "pgweb_linux_arm64_v7.zip"
      },
      "darwin-x64": {
        "pgweb": "pgweb_darwin_amd64.zip"
      },
      "darwin-arm64": {
        "pgweb": "pgweb_darwin_arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "sst/opencode",
      "version": "v1.17.8"
    },
    "release": {
      "tag_name": "v1.17.8",
      "assets": [
        {
          "id": 450593294,
          "name": "latest-linux-arm64.yml",
          "size": 583,
          "content_type": "application/yaml",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/latest-linux-arm64.yml"
        },
        {
          "id": 450593273,
          "name": "latest-linux.yml",
          "size": 584,
          "content_type": "application/yaml",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/latest-linux.yml"
        },
        {
          "id": 450593309,
          "name": "latest-mac.yml",
          "size": 703,
          "content_type": "application/yaml",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/latest-mac.yml"
        },
        {
          "id": 450593241,
          "name": "latest.json",
          "size": 9629,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/latest.json"
        },
        {
          "id": 450593258,
          "name": "latest.yml",
          "size": 383,
          "content_type": "application/yaml",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/latest.yml"
        },
        {
          "id": 450575627,
          "name": "opencode-darwin-arm64.zip",
          "size": 41247309,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-darwin-arm64.zip"
        },
        {
          "id": 450575630,
          "name": "opencode-darwin-x64-baseline.zip",
          "size": 43558221,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-darwin-x64-baseline.zip"
        },
        {
          "id": 450575626,
          "name": "opencode-darwin-x64.zip",
          "size": 43558221,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-darwin-x64.zip"
        },
        {
          "id": 450591077,
          "name": "opencode-desktop-linux-aarch64.rpm",
          "size": 95487165,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-aarch64.rpm"
        },
        {
          "id": 450591021,
          "name": "opencode-desktop-linux-amd64.deb",
          "size": 117774556,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-amd64.deb"
        },
        {
          "id": 450591003,
          "name": "opencode-desktop-linux-arm64.AppImage",
          "size": 150373126,
          "content_type": "application/vnd.appimage",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-arm64.AppImage"
        },
        {
          "id": 450591029,
          "name": "opencode-desktop-linux-arm64.deb",
          "size": 111105032,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-arm64.deb"
        },
        {
          "id": 450591015,
          "name": "opencode-desktop-linux-x86_64.AppImage",
          "size": 151887708,
          "content_type": "application/vnd.appimage",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-x86_64.AppImage"
        },
        {
          "id": 450591138,
          "name": "opencode-desktop-linux-x86_64.rpm",
          "size": 101786569,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-linux-x86_64.rpm"
        },
        {
          "id": 450591162,
          "name": "opencode-desktop-mac-arm64.app.tar.gz",
          "size": 144771112,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-arm64.app.tar.gz"
        },
        {
          "id": 450590896,
          "name": "opencode-desktop-mac-arm64.dmg",
          "size": 144056503,
          "content_type": "application/x-apple-diskimage",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-arm64.dmg"
        },
        {
          "id": 450590873,
          "name": "opencode-desktop-mac-arm64.dmg.blockmap",
          "size": 152003,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-arm64.dmg.blockmap"
        },
        {
          "id": 450590900,
          "name": "opencode-desktop-mac-arm64.zip",
          "size": 142680856,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-arm64.zip"
        },
        {
          "id": 450590883,
          "name": "opencode-desktop-mac-arm64.zip.blockmap",
          "size": 150995,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-arm64.zip.blockmap"
        },
        {
          "id": 450591171,
          "name": "opencode-desktop-mac-x64.app.tar.gz",
          "size": 149802852,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-x64.app.tar.gz"
        },
        {
          "id": 450590898,
          "name": "opencode-desktop-mac-x64.dmg",
          "size": 148960720,
          "content_type": "application/x-apple-diskimage",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-x64.dmg"
        },
        {
          "id": 450590881,
          "name": "opencode-desktop-mac-x64.dmg.blockmap",
          "size": 156945,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-x64.dmg.blockmap"
        },
        {
          "id": 450590991,
          "name": "opencode-desktop-mac-x64.zip",
          "size": 147619012,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-x64.zip"
        },
        {
          "id": 450590889,
          "name": "opencode-desktop-mac-x64.zip.blockmap",
          "size": 153867,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-mac-x64.zip.blockmap"
        },
        {
          "id": 450590880,
          "name": "opencode-desktop-win-arm64.exe",
          "size": 113770928,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-win-arm64.exe"
        },
        {
          "id": 450590890,
          "name": "opencode-desktop-win-arm64.exe.blockmap",
          "size": 120341,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-win-arm64.exe.blockmap"
        },
        {
          "id": 450590882,
          "name": "opencode-desktop-win-x64.exe",
          "size": 121259000,
          "content_type": "application/x-msdownload",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-win-x64.exe"
        },
        {
          "id": 450590891,
          "name": "opencode-desktop-win-x64.exe.blockmap",
          "size": 128701,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-desktop-win-x64.exe.blockmap"
        },
        {
          "id": 450575725,
          "name": "opencode-linux-arm64-musl.tar.gz",
          "size": 53163572,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-arm64-musl.tar.gz"
        },
        {
          "id": 450575887,
          "name": "opencode-linux-arm64.tar.gz",
          "size": 54570182,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-arm64.tar.gz"
        },
        {
          "id": 450575704,
          "name": "opencode-linux-x64-baseline-musl.tar.gz",
          "size": 53536554,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-x64-baseline-musl.tar.gz"
        },
        {
          "id": 450575723,
          "name": "opencode-linux-x64-baseline.tar.gz",
          "size": 54769220,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-x64-baseline.tar.gz"
        },
        {
          "id": 450575800,
          "name": "opencode-linux-x64-musl.tar.gz",
          "size": 53536554,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-x64-musl.tar.gz"
        },
        {
          "id": 450575713,
          "name": "opencode-linux-x64.tar.gz",
          "size": 54769221,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-linux-x64.tar.gz"
        },
        {
          "id": 450578187,
          "name": "opencode-windows-arm64.zip",
          "size": 53978611,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-windows-arm64.zip"
        },
        {
          "id": 450578189,
          "name": "opencode-windows-x64-baseline.zip",
          "size": 55812178,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-windows-x64-baseline.zip"
        },
        {
          "id": 450578190,
          "name": "opencode-windows-x64.zip",
          "size": 55812179,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/anomalyco/opencode/releases/download/v1.17.8/opencode-windows-x64.zip"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "opencode": "opencode-linux-x64.tar.gz"
      },
      "linux-arm64": {
        "opencode": "opencode-linux-arm64.tar.gz"
      },
      "darwin-x64": {
        "opencode": "opencode-darwin-x64.zip"
      },
      "darwin-arm64": {
        "opencode": "opencode-darwin-arm64.zip"
      }
    }
  },
  {
    "pkg": {
      "repo": "stacklok/toolhive"
    },
    "release": {
      "tag_name": "v0.30.0",
      "assets": [
        {
          "id": 450403965,
          "name": "crd-api.md",
          "size": 271834,
          "content_type": "text/markdown; charset=utf-8",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/crd-api.md"
        },
        {
          "id": 450403957,
          "name": "publisher-provided.schema.json",
          "size": 14972,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/publisher-provided.schema.json"
        },
        {
          "id": 450403959,
          "name": "skill.schema.json",
          "size": 4794,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/skill.schema.json"
        },
        {
          "id": 450403964,
          "name": "swagger.json",
          "size": 348518,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/swagger.json"
        },
        {
          "id": 450403958,
          "name": "swagger.yaml",
          "size": 207291,
          "content_type": "application/yaml",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/swagger.yaml"
        },
        {
          "id": 450403966,
          "name": "thv-cli-docs.tar.gz",
          "size": 31391,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/thv-cli-docs.tar.gz"
        },
        {
          "id": 450403949,
          "name": "thv-crds.tar.gz",
          "size": 138780,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/thv-crds.tar.gz"
        },
        {
          "id": 450403901,
          "name": "toolhive-0.30.0.tar.gz",
          "size": 5819243,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive-0.30.0.tar.gz"
        },
        {
          "id": 450403939,
          "name": "toolhive_0.30.0_checksums.txt",
          "size": 1361,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_checksums.txt"
        },
        {
          "id": 450403899,
          "name": "toolhive_0.30.0_darwin_amd64.tar.gz",
          "size": 38416066,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_amd64.tar.gz"
        },
        {
          "id": 450403931,
          "name": "toolhive_0.30.0_darwin_amd64.tar.gz.sbom.json",
          "size": 473475,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_amd64.tar.gz.sbom.json"
        },
        {
          "id": 450403950,
          "name": "toolhive_0.30.0_darwin_amd64.tar.gz.sigstore.json",
          "size": 10219,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_amd64.tar.gz.sigstore.json"
        },
        {
          "id": 450403897,
          "name": "toolhive_0.30.0_darwin_arm64.tar.gz",
          "size": 35674794,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_arm64.tar.gz"
        },
        {
          "id": 450403930,
          "name": "toolhive_0.30.0_darwin_arm64.tar.gz.sbom.json",
          "size": 473475,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 450403948,
          "name": "toolhive_0.30.0_darwin_arm64.tar.gz.sigstore.json",
          "size": 10259,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_darwin_arm64.tar.gz.sigstore.json"
        },
        {
          "id": 450403886,
          "name": "toolhive_0.30.0_linux_amd64.tar.gz",
          "size": 37877884,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_amd64.tar.gz"
        },
        {
          "id": 450403927,
          "name": "toolhive_0.30.0_linux_amd64.tar.gz.sbom.json",
          "size": 474865,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_amd64.tar.gz.sbom.json"
        },
        {
          "id": 450403947,
          "name": "toolhive_0.30.0_linux_amd64.tar.gz.sigstore.json",
          "size": 10079,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_amd64.tar.gz.sigstore.json"
        },
        {
          "id": 450403883,
          "name": "toolhive_0.30.0_linux_arm64.tar.gz",
          "size": 34236421,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_arm64.tar.gz"
        },
        {
          "id": 450403918,
          "name": "toolhive_0.30.0_linux_arm64.tar.gz.sbom.json",
          "size": 474865,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 450403940,
          "name": "toolhive_0.30.0_linux_arm64.tar.gz.sigstore.json",
          "size": 10227,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_linux_arm64.tar.gz.sigstore.json"
        },
        {
          "id": 450403882,
          "name": "toolhive_0.30.0_windows_amd64.zip",
          "size": 38612308,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_amd64.zip"
        },
        {
          "id": 450403924,
          "name": "toolhive_0.30.0_windows_amd64.zip.sbom.json",
          "size": 484385,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_amd64.zip.sbom.json"
        },
        {
          "id": 450403942,
          "name": "toolhive_0.30.0_windows_amd64.zip.sigstore.json",
          "size": 10259,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_amd64.zip.sigstore.json"
        },
        {
          "id": 450403885,
          "name": "toolhive_0.30.0_windows_arm64.zip",
          "size": 34270648,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_arm64.zip"
        },
        {
          "id": 450403900,
          "name": "toolhive_0.30.0_windows_arm64.zip.sbom.json",
          "size": 484385,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_arm64.zip.sbom.json"
        },
        {
          "id": 450403941,
          "name": "toolhive_0.30.0_windows_arm64.zip.sigstore.json",
          "size": 10315,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/toolhive_0.30.0_windows_arm64.zip.sigstore.json"
        },
        {
          "id": 450403956,
          "name": "upstream-registry.schema.json",
          "size": 1751,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/stacklok/toolhive/releases/download/v0.30.0/upstream-registry.schema.json"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "toolhive": "toolhive_0.30.0_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "toolhive": "toolhive_0.30.0_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "toolhive": "toolhive_0.30.0_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "toolhive": "toolhive_0.30.0_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "starship/starship"
    },
    "release": {
      "tag_name": "v1.25.1",
      "assets": [
        {
          "id": 409313088,
          "name": "starship-aarch64-apple-darwin.pkg",
          "size": 13019526,
          "content_type": "application/x-xar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-apple-darwin.pkg"
        },
        {
          "id": 409313090,
          "name": "starship-aarch64-apple-darwin.pkg.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-apple-darwin.pkg.sha256"
        },
        {
          "id": 409313092,
          "name": "starship-aarch64-apple-darwin.tar.gz",
          "size": 3899437,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 409313089,
          "name": "starship-aarch64-apple-darwin.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 409313091,
          "name": "starship-aarch64-pc-windows-msvc.msi",
          "size": 5365760,
          "content_type": "application/x-msi",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-pc-windows-msvc.msi"
        },
        {
          "id": 409313098,
          "name": "starship-aarch64-pc-windows-msvc.msi.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-pc-windows-msvc.msi.sha256"
        },
        {
          "id": 409313100,
          "name": "starship-aarch64-pc-windows-msvc.zip",
          "size": 4178230,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 409313102,
          "name": "starship-aarch64-pc-windows-msvc.zip.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 409313103,
          "name": "starship-aarch64-unknown-linux-musl.tar.gz",
          "size": 4652881,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 409313111,
          "name": "starship-aarch64-unknown-linux-musl.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-aarch64-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 409313112,
          "name": "starship-arm-unknown-linux-musleabihf.tar.gz",
          "size": 4812566,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-arm-unknown-linux-musleabihf.tar.gz"
        },
        {
          "id": 409313114,
          "name": "starship-arm-unknown-linux-musleabihf.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-arm-unknown-linux-musleabihf.tar.gz.sha256"
        },
        {
          "id": 409313113,
          "name": "starship-i686-pc-windows-msvc.msi",
          "size": 5275648,
          "content_type": "application/x-msi",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-pc-windows-msvc.msi"
        },
        {
          "id": 409313118,
          "name": "starship-i686-pc-windows-msvc.msi.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-pc-windows-msvc.msi.sha256"
        },
        {
          "id": 409313119,
          "name": "starship-i686-pc-windows-msvc.zip",
          "size": 4089018,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-pc-windows-msvc.zip"
        },
        {
          "id": 409313120,
          "name": "starship-i686-pc-windows-msvc.zip.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 409313122,
          "name": "starship-i686-unknown-linux-musl.tar.gz",
          "size": 4906360,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-unknown-linux-musl.tar.gz"
        },
        {
          "id": 409313123,
          "name": "starship-i686-unknown-linux-musl.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-i686-unknown-linux-musl.tar.gz.sha256"
        },
        {
          "id": 409313125,
          "name": "starship-x86_64-apple-darwin.pkg",
          "size": 13407955,
          "content_type": "application/x-xar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-apple-darwin.pkg"
        },
        {
          "id": 409313126,
          "name": "starship-x86_64-apple-darwin.pkg.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-apple-darwin.pkg.sha256"
        },
        {
          "id": 409313127,
          "name": "starship-x86_64-apple-darwin.tar.gz",
          "size": 4286451,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 409313129,
          "name": "starship-x86_64-apple-darwin.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-apple-darwin.tar.gz.sha256"
        },
        {
          "id": 409313131,
          "name": "starship-x86_64-pc-windows-msvc.msi",
          "size": 5713920,
          "content_type": "application/x-msi",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-pc-windows-msvc.msi"
        },
        {
          "id": 409313132,
          "name": "starship-x86_64-pc-windows-msvc.msi.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-pc-windows-msvc.msi.sha256"
        },
        {
          "id": 409313135,
          "name": "starship-x86_64-pc-windows-msvc.zip",
          "size": 4511653,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 409313136,
          "name": "starship-x86_64-pc-windows-msvc.zip.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 409313138,
          "name": "starship-x86_64-unknown-freebsd.tar.gz",
          "size": 4913894,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-freebsd.tar.gz"
        },
        {
          "id": 409313139,
          "name": "starship-x86_64-unknown-freebsd.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-freebsd.tar.gz.sha256"
        },
        {
          "id": 409313141,
          "name": "starship-x86_64-unknown-linux-gnu.tar.gz",
          "size": 4969178,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 409313144,
          "name": "starship-x86_64-unknown-linux-gnu.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-linux-gnu.tar.gz.sha256"
        },
        {
          "id": 409313145,
          "name": "starship-x86_64-unknown-linux-musl.tar.gz",
          "size": 5046130,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 409313146,
          "name": "starship-x86_64-unknown-linux-musl.tar.gz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/starship/starship/releases/download/v1.25.1/starship-x86_64-unknown-linux-musl.tar.gz.sha256"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "starship": "starship-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "starship": "starship-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "starship": "starship-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "starship": "starship-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "steveyegge/beads",
      "version": "v1.0.4"
    },
    "release": {
      "tag_name": "v1.0.4",
      "assets": [
        {
          "id": 416071101,
          "name": "beads-v1.0.4.spdx.json",
          "size": 1048572,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads-v1.0.4.spdx.json"
        },
        {
          "id": 416068661,
          "name": "beads_1.0.4_android_arm64.tar.gz",
          "size": 27042710,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_android_arm64.tar.gz"
        },
        {
          "id": 416070843,
          "name": "beads_1.0.4_darwin_amd64.tar.gz",
          "size": 48030294,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_darwin_amd64.tar.gz"
        },
        {
          "id": 416070813,
          "name": "beads_1.0.4_darwin_arm64.tar.gz",
          "size": 44302058,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_darwin_arm64.tar.gz"
        },
        {
          "id": 416068689,
          "name": "beads_1.0.4_freebsd_amd64.tar.gz",
          "size": 27472061,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_freebsd_amd64.tar.gz"
        },
        {
          "id": 416068700,
          "name": "beads_1.0.4_linux_amd64.tar.gz",
          "size": 47668079,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_linux_amd64.tar.gz"
        },
        {
          "id": 416068729,
          "name": "beads_1.0.4_linux_arm64.tar.gz",
          "size": 44283170,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_linux_arm64.tar.gz"
        },
        {
          "id": 416068668,
          "name": "beads_1.0.4_windows_amd64.zip",
          "size": 48441432,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_windows_amd64.zip"
        },
        {
          "id": 416068680,
          "name": "beads_1.0.4_windows_arm64.zip",
          "size": 26340149,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/beads_1.0.4_windows_arm64.zip"
        },
        {
          "id": 416070878,
          "name": "checksums.txt",
          "size": 780,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/gastownhall/beads/releases/download/v1.0.4/checksums.txt"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "beads": "beads_1.0.4_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "beads": "beads_1.0.4_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "beads": "beads_1.0.4_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "beads": "beads_1.0.4_darwin_arm64.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "surrealdb/surrealdb"
    },
    "release": {
      "tag_name": "v3.1.5",
      "assets": [
        {
          "id": 452372627,
          "name": "LICENSE",
          "size": 4633,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/LICENSE"
        },
        {
          "id": 452372628,
          "name": "surreal-v3.1.5.darwin-amd64.tgz",
          "size": 48936042,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/surreal-v3.1.5.darwin-amd64.tgz"
        },
        {
          "id": 452372626,
          "name": "surreal-v3.1.5.darwin-arm64.tgz",
          "size": 41976462,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/surreal-v3.1.5.darwin-arm64.tgz"
        },
        {
          "id": 452372629,
          "name": "surreal-v3.1.5.linux-amd64.tgz",
          "size": 52463389,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/surreal-v3.1.5.linux-amd64.tgz"
        },
        {
          "id": 452372633,
          "name": "surreal-v3.1.5.linux-arm64.tgz",
          "size": 47904466,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/surreal-v3.1.5.linux-arm64.tgz"
        },
        {
          "id": 452372625,
          "name": "surreal-v3.1.5.windows-amd64.exe",
          "size": 113757184,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/surrealdb/surrealdb/releases/download/v3.1.5/surreal-v3.1.5.windows-amd64.exe"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "surreal": "surreal-v3.1.5.linux-amd64.tgz"
      },
      "linux-arm64": {
        "surreal": "surreal-v3.1.5.linux-arm64.tgz"
      },
      "darwin-x64": {
        "surreal": "surreal-v3.1.5.darwin-amd64.tgz"
      },
      "darwin-arm64": {
        "surreal": "surreal-v3.1.5.darwin-arm64.tgz"
      }
    }
  },
  {
    "pkg": {
      "repo": "TomWright/dasel"
    },
    "release": {
      "tag_name": "v3.11.1",
      "assets": [
        {
          "id": 453011867,
          "name": "dasel_darwin_amd64",
          "size": 10477424,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_darwin_amd64"
        },
        {
          "id": 453011879,
          "name": "dasel_darwin_amd64.gz",
          "size": 3985191,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_darwin_amd64.gz"
        },
        {
          "id": 453011878,
          "name": "dasel_darwin_arm64",
          "size": 9837218,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_darwin_arm64"
        },
        {
          "id": 453011904,
          "name": "dasel_darwin_arm64.gz",
          "size": 3663584,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_darwin_arm64.gz"
        },
        {
          "id": 453011864,
          "name": "dasel_linux_386",
          "size": 9715896,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_386"
        },
        {
          "id": 453011873,
          "name": "dasel_linux_386.gz",
          "size": 3734963,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_386.gz"
        },
        {
          "id": 453011875,
          "name": "dasel_linux_amd64",
          "size": 10363064,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_amd64"
        },
        {
          "id": 453011892,
          "name": "dasel_linux_amd64.gz",
          "size": 3963011,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_amd64.gz"
        },
        {
          "id": 453011745,
          "name": "dasel_linux_arm32",
          "size": 9896120,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_arm32"
        },
        {
          "id": 453011769,
          "name": "dasel_linux_arm32.gz",
          "size": 3725183,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_arm32.gz"
        },
        {
          "id": 453011865,
          "name": "dasel_linux_arm64",
          "size": 9765048,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_arm64"
        },
        {
          "id": 453011872,
          "name": "dasel_linux_arm64.gz",
          "size": 3556960,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_linux_arm64.gz"
        },
        {
          "id": 453011848,
          "name": "dasel_windows_386.exe",
          "size": 9964032,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_windows_386.exe"
        },
        {
          "id": 453011861,
          "name": "dasel_windows_386.exe.gz",
          "size": 3865337,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_windows_386.exe.gz"
        },
        {
          "id": 453011918,
          "name": "dasel_windows_amd64.exe",
          "size": 10632704,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_windows_amd64.exe"
        },
        {
          "id": 453011934,
          "name": "dasel_windows_amd64.exe.gz",
          "size": 4025032,
          "content_type": "binary/octet-stream",
          "browser_download_url": "https://github.com/TomWright/dasel/releases/download/v3.11.1/dasel_windows_amd64.exe.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "dasel": "dasel_linux_amd64"
      },
      "linux-arm64": {
        "dasel": "dasel_linux_arm64"
      },
      "darwin-x64": {
        "dasel": "dasel_darwin_amd64"
      },
      "darwin-arm64": {
        "dasel": "dasel_darwin_arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "twpayne/chezmoi"
    },
    "release": {
      "tag_name": "v2.70.5",
      "assets": [
        {
          "id": 437664251,
          "name": "chezmoi-2.70.5-aarch64.rpm",
          "size": 15645939,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-aarch64.rpm"
        },
        {
          "id": 437664247,
          "name": "chezmoi-2.70.5-armhfp.rpm",
          "size": 16340585,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-armhfp.rpm"
        },
        {
          "id": 437664164,
          "name": "chezmoi-2.70.5-armv5l.rpm",
          "size": 16372325,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-armv5l.rpm"
        },
        {
          "id": 437664174,
          "name": "chezmoi-2.70.5-i686.rpm",
          "size": 16453148,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-i686.rpm"
        },
        {
          "id": 437664235,
          "name": "chezmoi-2.70.5-loong64.rpm",
          "size": 16442973,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-loong64.rpm"
        },
        {
          "id": 437664259,
          "name": "chezmoi-2.70.5-mips64.rpm",
          "size": 14964242,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-mips64.rpm"
        },
        {
          "id": 437664241,
          "name": "chezmoi-2.70.5-mips64le.rpm",
          "size": 14896992,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-mips64le.rpm"
        },
        {
          "id": 437664243,
          "name": "chezmoi-2.70.5-ppc64.rpm",
          "size": 15699005,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-ppc64.rpm"
        },
        {
          "id": 437664255,
          "name": "chezmoi-2.70.5-ppc64le.rpm",
          "size": 15700703,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-ppc64le.rpm"
        },
        {
          "id": 437664265,
          "name": "chezmoi-2.70.5-riscv64.rpm",
          "size": 16263669,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-riscv64.rpm"
        },
        {
          "id": 437664271,
          "name": "chezmoi-2.70.5-s390x.rpm",
          "size": 16718462,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-s390x.rpm"
        },
        {
          "id": 437664172,
          "name": "chezmoi-2.70.5-x86_64.rpm",
          "size": 17348823,
          "content_type": "application/x-rpm",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5-x86_64.rpm"
        },
        {
          "id": 437664108,
          "name": "chezmoi-2.70.5.tar.gz",
          "size": 2514323,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-2.70.5.tar.gz"
        },
        {
          "id": 437664427,
          "name": "chezmoi-darwin-amd64",
          "size": 48351408,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-darwin-amd64"
        },
        {
          "id": 437664430,
          "name": "chezmoi-darwin-arm64",
          "size": 44980018,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-darwin-arm64"
        },
        {
          "id": 437664431,
          "name": "chezmoi-linux-amd64",
          "size": 47419848,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-linux-amd64"
        },
        {
          "id": 437664435,
          "name": "chezmoi-linux-amd64-musl",
          "size": 47500784,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-linux-amd64-musl"
        },
        {
          "id": 437664448,
          "name": "chezmoi-windows-amd64.exe",
          "size": 48188416,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi-windows-amd64.exe"
        },
        {
          "id": 437663976,
          "name": "chezmoi_2.70.5_android_arm64.tar.gz",
          "size": 16632190,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_android_arm64.tar.gz"
        },
        {
          "id": 437664358,
          "name": "chezmoi_2.70.5_android_arm64.tar.gz.sbom.json",
          "size": 280741,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_android_arm64.tar.gz.sbom.json"
        },
        {
          "id": 437664421,
          "name": "chezmoi_2.70.5_checksums.txt",
          "size": 10731,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_checksums.txt"
        },
        {
          "id": 437664422,
          "name": "chezmoi_2.70.5_checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_checksums.txt.sig"
        },
        {
          "id": 437663975,
          "name": "chezmoi_2.70.5_darwin_amd64.tar.gz",
          "size": 17610850,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_darwin_amd64.tar.gz"
        },
        {
          "id": 437664356,
          "name": "chezmoi_2.70.5_darwin_amd64.tar.gz.sbom.json",
          "size": 279096,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_darwin_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437664008,
          "name": "chezmoi_2.70.5_darwin_arm64.tar.gz",
          "size": 16346244,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_darwin_arm64.tar.gz"
        },
        {
          "id": 437664372,
          "name": "chezmoi_2.70.5_darwin_arm64.tar.gz.sbom.json",
          "size": 279096,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_darwin_arm64.tar.gz.sbom.json"
        },
        {
          "id": 437664081,
          "name": "chezmoi_2.70.5_freebsd_amd64.tar.gz",
          "size": 17161451,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_amd64.tar.gz"
        },
        {
          "id": 437664402,
          "name": "chezmoi_2.70.5_freebsd_amd64.tar.gz.sbom.json",
          "size": 279277,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437664028,
          "name": "chezmoi_2.70.5_freebsd_arm64.tar.gz",
          "size": 15553310,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_arm64.tar.gz"
        },
        {
          "id": 437664380,
          "name": "chezmoi_2.70.5_freebsd_arm64.tar.gz.sbom.json",
          "size": 279277,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 437663988,
          "name": "chezmoi_2.70.5_freebsd_armv5.tar.gz",
          "size": 16286827,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_armv5.tar.gz"
        },
        {
          "id": 437664360,
          "name": "chezmoi_2.70.5_freebsd_armv5.tar.gz.sbom.json",
          "size": 277794,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_armv5.tar.gz.sbom.json"
        },
        {
          "id": 437663991,
          "name": "chezmoi_2.70.5_freebsd_armv6.tar.gz",
          "size": 16261821,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_armv6.tar.gz"
        },
        {
          "id": 437664359,
          "name": "chezmoi_2.70.5_freebsd_armv6.tar.gz.sbom.json",
          "size": 277794,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_armv6.tar.gz.sbom.json"
        },
        {
          "id": 437664004,
          "name": "chezmoi_2.70.5_freebsd_i386.tar.gz",
          "size": 16308044,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_i386.tar.gz"
        },
        {
          "id": 437664368,
          "name": "chezmoi_2.70.5_freebsd_i386.tar.gz.sbom.json",
          "size": 277614,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_freebsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 437664097,
          "name": "chezmoi_2.70.5_linux-glibc_amd64.tar.gz",
          "size": 17394516,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux-glibc_amd64.tar.gz"
        },
        {
          "id": 437664416,
          "name": "chezmoi_2.70.5_linux-glibc_amd64.tar.gz.sbom.json",
          "size": 281469,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux-glibc_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437664100,
          "name": "chezmoi_2.70.5_linux-musl_amd64.tar.gz",
          "size": 17440909,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux-musl_amd64.tar.gz"
        },
        {
          "id": 437664418,
          "name": "chezmoi_2.70.5_linux-musl_amd64.tar.gz.sbom.json",
          "size": 281287,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux-musl_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437664285,
          "name": "chezmoi_2.70.5_linux_386.apk",
          "size": 17097685,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_386.apk"
        },
        {
          "id": 437664121,
          "name": "chezmoi_2.70.5_linux_386.pkg.tar.zst",
          "size": 16192570,
          "content_type": "application/zstd",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_386.pkg.tar.zst"
        },
        {
          "id": 437664275,
          "name": "chezmoi_2.70.5_linux_amd64.apk",
          "size": 18089448,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_amd64.apk"
        },
        {
          "id": 437664151,
          "name": "chezmoi_2.70.5_linux_amd64.deb",
          "size": 17391776,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_amd64.deb"
        },
        {
          "id": 437664123,
          "name": "chezmoi_2.70.5_linux_amd64.pkg.tar.zst",
          "size": 17273668,
          "content_type": "application/zstd",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_amd64.pkg.tar.zst"
        },
        {
          "id": 437663993,
          "name": "chezmoi_2.70.5_linux_amd64.tar.gz",
          "size": 17394516,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_amd64.tar.gz"
        },
        {
          "id": 437664361,
          "name": "chezmoi_2.70.5_linux_amd64.tar.gz.sbom.json",
          "size": 280377,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437664280,
          "name": "chezmoi_2.70.5_linux_arm64.apk",
          "size": 16222779,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_arm64.apk"
        },
        {
          "id": 437664183,
          "name": "chezmoi_2.70.5_linux_arm64.deb",
          "size": 15717302,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_arm64.deb"
        },
        {
          "id": 437664115,
          "name": "chezmoi_2.70.5_linux_arm64.pkg.tar.zst",
          "size": 15457487,
          "content_type": "application/zstd",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_arm64.pkg.tar.zst"
        },
        {
          "id": 437664058,
          "name": "chezmoi_2.70.5_linux_arm64.tar.gz",
          "size": 15721117,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_arm64.tar.gz"
        },
        {
          "id": 437664392,
          "name": "chezmoi_2.70.5_linux_arm64.tar.gz.sbom.json",
          "size": 280377,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_arm64.tar.gz.sbom.json"
        },
        {
          "id": 437664141,
          "name": "chezmoi_2.70.5_linux_armel.deb",
          "size": 16447906,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armel.deb"
        },
        {
          "id": 437664155,
          "name": "chezmoi_2.70.5_linux_armhf.deb",
          "size": 16420790,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armhf.deb"
        },
        {
          "id": 437664282,
          "name": "chezmoi_2.70.5_linux_armv5.apk",
          "size": 17007355,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv5.apk"
        },
        {
          "id": 437664022,
          "name": "chezmoi_2.70.5_linux_armv5.tar.gz",
          "size": 16450057,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv5.tar.gz"
        },
        {
          "id": 437664375,
          "name": "chezmoi_2.70.5_linux_armv5.tar.gz.sbom.json",
          "size": 278896,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv5.tar.gz.sbom.json"
        },
        {
          "id": 437664340,
          "name": "chezmoi_2.70.5_linux_armv6.apk",
          "size": 16979350,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv6.apk"
        },
        {
          "id": 437664085,
          "name": "chezmoi_2.70.5_linux_armv6.tar.gz",
          "size": 16425991,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv6.tar.gz"
        },
        {
          "id": 437664406,
          "name": "chezmoi_2.70.5_linux_armv6.tar.gz.sbom.json",
          "size": 278896,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_armv6.tar.gz.sbom.json"
        },
        {
          "id": 437664146,
          "name": "chezmoi_2.70.5_linux_i386.deb",
          "size": 16492586,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_i386.deb"
        },
        {
          "id": 437664032,
          "name": "chezmoi_2.70.5_linux_i386.tar.gz",
          "size": 16491530,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_i386.tar.gz"
        },
        {
          "id": 437664381,
          "name": "chezmoi_2.70.5_linux_i386.tar.gz.sbom.json",
          "size": 278715,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_i386.tar.gz.sbom.json"
        },
        {
          "id": 437664322,
          "name": "chezmoi_2.70.5_linux_loong64.apk",
          "size": 17061580,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_loong64.apk"
        },
        {
          "id": 437664152,
          "name": "chezmoi_2.70.5_linux_loong64.deb",
          "size": 16522650,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_loong64.deb"
        },
        {
          "id": 437663992,
          "name": "chezmoi_2.70.5_linux_loong64.tar.gz",
          "size": 16523057,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_loong64.tar.gz"
        },
        {
          "id": 437664365,
          "name": "chezmoi_2.70.5_linux_loong64.tar.gz.sbom.json",
          "size": 279258,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_loong64.tar.gz.sbom.json"
        },
        {
          "id": 437664138,
          "name": "chezmoi_2.70.5_linux_mips64.deb",
          "size": 14998022,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64.deb"
        },
        {
          "id": 437664157,
          "name": "chezmoi_2.70.5_linux_mips64le.deb",
          "size": 14903244,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64le.deb"
        },
        {
          "id": 437664348,
          "name": "chezmoi_2.70.5_linux_mips64le_hardfloat.apk",
          "size": 15504262,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64le_hardfloat.apk"
        },
        {
          "id": 437664090,
          "name": "chezmoi_2.70.5_linux_mips64le_hardfloat.tar.gz",
          "size": 14909438,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64le_hardfloat.tar.gz"
        },
        {
          "id": 437664407,
          "name": "chezmoi_2.70.5_linux_mips64le_hardfloat.tar.gz.sbom.json",
          "size": 281249,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64le_hardfloat.tar.gz.sbom.json"
        },
        {
          "id": 437664336,
          "name": "chezmoi_2.70.5_linux_mips64_hardfloat.apk",
          "size": 15848854,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64_hardfloat.apk"
        },
        {
          "id": 437664048,
          "name": "chezmoi_2.70.5_linux_mips64_hardfloat.tar.gz",
          "size": 15001572,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64_hardfloat.tar.gz"
        },
        {
          "id": 437664393,
          "name": "chezmoi_2.70.5_linux_mips64_hardfloat.tar.gz.sbom.json",
          "size": 280887,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_mips64_hardfloat.tar.gz.sbom.json"
        },
        {
          "id": 437664341,
          "name": "chezmoi_2.70.5_linux_ppc64.apk",
          "size": 16445045,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64.apk"
        },
        {
          "id": 437664168,
          "name": "chezmoi_2.70.5_linux_ppc64.deb",
          "size": 15794386,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64.deb"
        },
        {
          "id": 437664005,
          "name": "chezmoi_2.70.5_linux_ppc64.tar.gz",
          "size": 15788824,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64.tar.gz"
        },
        {
          "id": 437664369,
          "name": "chezmoi_2.70.5_linux_ppc64.tar.gz.sbom.json",
          "size": 278896,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64.tar.gz.sbom.json"
        },
        {
          "id": 437664323,
          "name": "chezmoi_2.70.5_linux_ppc64le.apk",
          "size": 16310819,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64le.apk"
        },
        {
          "id": 437664117,
          "name": "chezmoi_2.70.5_linux_ppc64le.deb",
          "size": 15777174,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64le.deb"
        },
        {
          "id": 437664002,
          "name": "chezmoi_2.70.5_linux_ppc64le.tar.gz",
          "size": 15782801,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64le.tar.gz"
        },
        {
          "id": 437664367,
          "name": "chezmoi_2.70.5_linux_ppc64le.tar.gz.sbom.json",
          "size": 279258,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_ppc64le.tar.gz.sbom.json"
        },
        {
          "id": 437664325,
          "name": "chezmoi_2.70.5_linux_riscv64.apk",
          "size": 16836311,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_riscv64.apk"
        },
        {
          "id": 437664127,
          "name": "chezmoi_2.70.5_linux_riscv64.deb",
          "size": 16305954,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_riscv64.deb"
        },
        {
          "id": 437664088,
          "name": "chezmoi_2.70.5_linux_riscv64.tar.gz",
          "size": 16308143,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_riscv64.tar.gz"
        },
        {
          "id": 437664408,
          "name": "chezmoi_2.70.5_linux_riscv64.tar.gz.sbom.json",
          "size": 279258,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_riscv64.tar.gz.sbom.json"
        },
        {
          "id": 437664327,
          "name": "chezmoi_2.70.5_linux_s390x.apk",
          "size": 17600368,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_s390x.apk"
        },
        {
          "id": 437664134,
          "name": "chezmoi_2.70.5_linux_s390x.deb",
          "size": 16758142,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_s390x.deb"
        },
        {
          "id": 437664096,
          "name": "chezmoi_2.70.5_linux_s390x.tar.gz",
          "size": 16761831,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_s390x.tar.gz"
        },
        {
          "id": 437664413,
          "name": "chezmoi_2.70.5_linux_s390x.tar.gz.sbom.json",
          "size": 278896,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_linux_s390x.tar.gz.sbom.json"
        },
        {
          "id": 437664066,
          "name": "chezmoi_2.70.5_openbsd_amd64.tar.gz",
          "size": 17305883,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_amd64.tar.gz"
        },
        {
          "id": 437664400,
          "name": "chezmoi_2.70.5_openbsd_amd64.tar.gz.sbom.json",
          "size": 280741,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_amd64.tar.gz.sbom.json"
        },
        {
          "id": 437663977,
          "name": "chezmoi_2.70.5_openbsd_arm64.tar.gz",
          "size": 15689460,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_arm64.tar.gz"
        },
        {
          "id": 437664352,
          "name": "chezmoi_2.70.5_openbsd_arm64.tar.gz.sbom.json",
          "size": 280741,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_arm64.tar.gz.sbom.json"
        },
        {
          "id": 437664040,
          "name": "chezmoi_2.70.5_openbsd_armv5.tar.gz",
          "size": 16417454,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_armv5.tar.gz"
        },
        {
          "id": 437664389,
          "name": "chezmoi_2.70.5_openbsd_armv5.tar.gz.sbom.json",
          "size": 279258,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_armv5.tar.gz.sbom.json"
        },
        {
          "id": 437664094,
          "name": "chezmoi_2.70.5_openbsd_armv6.tar.gz",
          "size": 16393087,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_armv6.tar.gz"
        },
        {
          "id": 437664411,
          "name": "chezmoi_2.70.5_openbsd_armv6.tar.gz.sbom.json",
          "size": 279258,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_armv6.tar.gz.sbom.json"
        },
        {
          "id": 437664031,
          "name": "chezmoi_2.70.5_openbsd_i386.tar.gz",
          "size": 16441697,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_i386.tar.gz"
        },
        {
          "id": 437664387,
          "name": "chezmoi_2.70.5_openbsd_i386.tar.gz.sbom.json",
          "size": 279077,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_openbsd_i386.tar.gz.sbom.json"
        },
        {
          "id": 437663978,
          "name": "chezmoi_2.70.5_windows_amd64.zip",
          "size": 17621171,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_amd64.zip"
        },
        {
          "id": 437664355,
          "name": "chezmoi_2.70.5_windows_amd64.zip.sbom.json",
          "size": 288947,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_amd64.zip.sbom.json"
        },
        {
          "id": 437664072,
          "name": "chezmoi_2.70.5_windows_arm64.zip",
          "size": 15749795,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_arm64.zip"
        },
        {
          "id": 437664401,
          "name": "chezmoi_2.70.5_windows_arm64.zip.sbom.json",
          "size": 288947,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_arm64.zip.sbom.json"
        },
        {
          "id": 437664059,
          "name": "chezmoi_2.70.5_windows_i386.zip",
          "size": 17054482,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_i386.zip"
        },
        {
          "id": 437664397,
          "name": "chezmoi_2.70.5_windows_i386.zip.sbom.json",
          "size": 287273,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_2.70.5_windows_i386.zip.sbom.json"
        },
        {
          "id": 437664425,
          "name": "chezmoi_cosign.pub",
          "size": 178,
          "content_type": "application/vnd.ms-publisher",
          "browser_download_url": "https://github.com/twpayne/chezmoi/releases/download/v2.70.5/chezmoi_cosign.pub"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "chezmoi": "chezmoi-linux-amd64"
      },
      "linux-arm64": {
        "chezmoi": "chezmoi_2.70.5_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "chezmoi": "chezmoi-darwin-amd64"
      },
      "darwin-arm64": {
        "chezmoi": "chezmoi-darwin-arm64"
      }
    }
  },
  {
    "pkg": {
      "repo": "watchexec/watchexec",
      "version": "v2.5.1"
    },
    "release": {
      "tag_name": "v2.5.1",
      "assets": [
        {
          "id": 384489955,
          "name": "B3SUMS",
          "size": 3509,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/B3SUMS"
        },
        {
          "id": 384489924,
          "name": "dist-manifest.json",
          "size": 8507,
          "content_type": "application/json",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/dist-manifest.json"
        },
        {
          "id": 384489928,
          "name": "SHA256SUMS",
          "size": 3509,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/SHA256SUMS"
        },
        {
          "id": 384489994,
          "name": "SHA512SUMS",
          "size": 5493,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/SHA512SUMS"
        },
        {
          "id": 384489930,
          "name": "watchexec-2.5.1-aarch64-apple-darwin.tar.xz",
          "size": 1953616,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-apple-darwin.tar.xz"
        },
        {
          "id": 384489969,
          "name": "watchexec-2.5.1-aarch64-apple-darwin.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-apple-darwin.tar.xz.b3"
        },
        {
          "id": 384490039,
          "name": "watchexec-2.5.1-aarch64-apple-darwin.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-apple-darwin.tar.xz.sha256"
        },
        {
          "id": 384490045,
          "name": "watchexec-2.5.1-aarch64-apple-darwin.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-apple-darwin.tar.xz.sha512"
        },
        {
          "id": 384489952,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.deb",
          "size": 2423360,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.deb"
        },
        {
          "id": 384489965,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.b3"
        },
        {
          "id": 384490017,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 384490012,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.deb.sha512"
        },
        {
          "id": 384489925,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm",
          "size": 2815541,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm"
        },
        {
          "id": 384489989,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.b3"
        },
        {
          "id": 384490036,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.sha256"
        },
        {
          "id": 384490042,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.rpm.sha512"
        },
        {
          "id": 384489957,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz",
          "size": 2412188,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz"
        },
        {
          "id": 384489959,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.b3"
        },
        {
          "id": 384490015,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.sha256"
        },
        {
          "id": 384490033,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz.sha512"
        },
        {
          "id": 384489934,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.deb",
          "size": 2492920,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.deb"
        },
        {
          "id": 384489984,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.deb.b3"
        },
        {
          "id": 384490043,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.deb.sha256"
        },
        {
          "id": 384490048,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.deb.sha512"
        },
        {
          "id": 384489946,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.rpm",
          "size": 2885867,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.rpm"
        },
        {
          "id": 384489960,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.b3"
        },
        {
          "id": 384490009,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.sha256"
        },
        {
          "id": 384490029,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.rpm.sha512"
        },
        {
          "id": 384489962,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz",
          "size": 2481320,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz"
        },
        {
          "id": 384489968,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.b3"
        },
        {
          "id": 384490038,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.sha256"
        },
        {
          "id": 384490046,
          "name": "watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-aarch64-unknown-linux-musl.tar.xz.sha512"
        },
        {
          "id": 384489929,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb",
          "size": 2490668,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb"
        },
        {
          "id": 384489981,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.b3"
        },
        {
          "id": 384490014,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.sha256"
        },
        {
          "id": 384490023,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.deb.sha512"
        },
        {
          "id": 384489953,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm",
          "size": 2904580,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm"
        },
        {
          "id": 384489982,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.b3"
        },
        {
          "id": 384490024,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.sha256"
        },
        {
          "id": 384490044,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.rpm.sha512"
        },
        {
          "id": 384489933,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz",
          "size": 2479056,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz"
        },
        {
          "id": 384489971,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.b3"
        },
        {
          "id": 384490047,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.sha256"
        },
        {
          "id": 384490021,
          "name": "watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-armv7-unknown-linux-gnueabihf.tar.xz.sha512"
        },
        {
          "id": 384489920,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.deb",
          "size": 2943352,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.deb"
        },
        {
          "id": 384489978,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.deb.b3"
        },
        {
          "id": 384490019,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.deb.sha256"
        },
        {
          "id": 384490037,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.deb.sha512"
        },
        {
          "id": 384489932,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.rpm",
          "size": 3161294,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.rpm"
        },
        {
          "id": 384489966,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.rpm.b3"
        },
        {
          "id": 384490041,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.rpm.sha256"
        },
        {
          "id": 384490011,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.rpm.sha512"
        },
        {
          "id": 384489919,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.tar.xz",
          "size": 2932004,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.tar.xz"
        },
        {
          "id": 384489970,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.b3"
        },
        {
          "id": 384490022,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.sha256"
        },
        {
          "id": 384490008,
          "name": "watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-i686-unknown-linux-musl.tar.xz.sha512"
        },
        {
          "id": 384489937,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb",
          "size": 2661448,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb"
        },
        {
          "id": 384489976,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.b3"
        },
        {
          "id": 384490028,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 384490018,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.deb.sha512"
        },
        {
          "id": 384489950,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm",
          "size": 3070241,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm"
        },
        {
          "id": 384489973,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.b3"
        },
        {
          "id": 384490025,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.sha256"
        },
        {
          "id": 384490032,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.rpm.sha512"
        },
        {
          "id": 384489926,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz",
          "size": 2649548,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz"
        },
        {
          "id": 384489967,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.b3"
        },
        {
          "id": 384490040,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.sha256"
        },
        {
          "id": 384490016,
          "name": "watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-powerpc64le-unknown-linux-gnu.tar.xz.sha512"
        },
        {
          "id": 384489927,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb",
          "size": 2811248,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb"
        },
        {
          "id": 384489975,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.b3"
        },
        {
          "id": 384490027,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 384490034,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.deb.sha512"
        },
        {
          "id": 384489945,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm",
          "size": 3096507,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm"
        },
        {
          "id": 384489964,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.b3"
        },
        {
          "id": 384490020,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.sha256"
        },
        {
          "id": 384490013,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.rpm.sha512"
        },
        {
          "id": 384489943,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz",
          "size": 2800272,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz"
        },
        {
          "id": 384489958,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.b3"
        },
        {
          "id": 384490010,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.sha256"
        },
        {
          "id": 384490030,
          "name": "watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-riscv64gc-unknown-linux-gnu.tar.xz.sha512"
        },
        {
          "id": 384489935,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.deb",
          "size": 2673664,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.deb"
        },
        {
          "id": 384489983,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.deb.b3"
        },
        {
          "id": 384490031,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 384489990,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.deb.sha512"
        },
        {
          "id": 384489956,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.rpm",
          "size": 3039469,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.rpm"
        },
        {
          "id": 384489974,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.b3"
        },
        {
          "id": 384489985,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.sha256"
        },
        {
          "id": 384490005,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.rpm.sha512"
        },
        {
          "id": 384489922,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz",
          "size": 2661304,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz"
        },
        {
          "id": 384489980,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.b3"
        },
        {
          "id": 384490007,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.sha256"
        },
        {
          "id": 384489999,
          "name": "watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-s390x-unknown-linux-gnu.tar.xz.sha512"
        },
        {
          "id": 384489931,
          "name": "watchexec-2.5.1-x86_64-apple-darwin.tar.xz",
          "size": 2294200,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-apple-darwin.tar.xz"
        },
        {
          "id": 384489963,
          "name": "watchexec-2.5.1-x86_64-apple-darwin.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-apple-darwin.tar.xz.b3"
        },
        {
          "id": 384490035,
          "name": "watchexec-2.5.1-x86_64-apple-darwin.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-apple-darwin.tar.xz.sha256"
        },
        {
          "id": 384490002,
          "name": "watchexec-2.5.1-x86_64-apple-darwin.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-apple-darwin.tar.xz.sha512"
        },
        {
          "id": 384489949,
          "name": "watchexec-2.5.1-x86_64-pc-windows-msvc.zip",
          "size": 3336586,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 384489961,
          "name": "watchexec-2.5.1-x86_64-pc-windows-msvc.zip.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-pc-windows-msvc.zip.b3"
        },
        {
          "id": 384489996,
          "name": "watchexec-2.5.1-x86_64-pc-windows-msvc.zip.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-pc-windows-msvc.zip.sha256"
        },
        {
          "id": 384489988,
          "name": "watchexec-2.5.1-x86_64-pc-windows-msvc.zip.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-pc-windows-msvc.zip.sha512"
        },
        {
          "id": 384489947,
          "name": "watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz",
          "size": 2779120,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz"
        },
        {
          "id": 384489979,
          "name": "watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.b3"
        },
        {
          "id": 384489986,
          "name": "watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.sha256"
        },
        {
          "id": 384490026,
          "name": "watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-freebsd.tar.xz.sha512"
        },
        {
          "id": 384489954,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.deb",
          "size": 2801288,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.deb"
        },
        {
          "id": 384489972,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.b3"
        },
        {
          "id": 384489993,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.sha256"
        },
        {
          "id": 384490003,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.deb.sha512"
        },
        {
          "id": 384489977,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm",
          "size": 3001589,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm"
        },
        {
          "id": 384489944,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.b3"
        },
        {
          "id": 384489987,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.sha256"
        },
        {
          "id": 384489991,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.rpm.sha512"
        },
        {
          "id": 384489923,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz",
          "size": 2789564,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz"
        },
        {
          "id": 384489942,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.b3"
        },
        {
          "id": 384490000,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.sha256"
        },
        {
          "id": 384490001,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz.sha512"
        },
        {
          "id": 384489921,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.deb",
          "size": 2920696,
          "content_type": "application/x-debian-package",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.deb"
        },
        {
          "id": 384489941,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.deb.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.deb.b3"
        },
        {
          "id": 384489995,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.deb.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.deb.sha256"
        },
        {
          "id": 384489998,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.deb.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.deb.sha512"
        },
        {
          "id": 384489948,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.rpm",
          "size": 3138510,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.rpm"
        },
        {
          "id": 384489939,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.b3"
        },
        {
          "id": 384490004,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.sha256"
        },
        {
          "id": 384489992,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.rpm.sha512"
        },
        {
          "id": 384489936,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz",
          "size": 2910140,
          "content_type": "application/x-xz",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz"
        },
        {
          "id": 384489938,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.b3",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.b3"
        },
        {
          "id": 384490006,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.sha256",
          "size": 65,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.sha256"
        },
        {
          "id": 384489997,
          "name": "watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.sha512",
          "size": 129,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/watchexec/watchexec/releases/download/v2.5.1/watchexec-2.5.1-x86_64-unknown-linux-musl.tar.xz.sha512"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "watchexec": "watchexec-2.5.1-x86_64-unknown-linux-gnu.tar.xz"
      },
      "linux-arm64": {
        "watchexec": "watchexec-2.5.1-aarch64-unknown-linux-gnu.tar.xz"
      },
      "darwin-x64": {
        "watchexec": "watchexec-2.5.1-x86_64-apple-darwin.tar.xz"
      },
      "darwin-arm64": {
        "watchexec": "watchexec-2.5.1-aarch64-apple-darwin.tar.xz"
      }
    }
  },
  {
    "pkg": {
      "repo": "Wilfred/difftastic",
      "version": "0.69.0"
    },
    "release": {
      "tag_name": "0.69.0",
      "assets": [
        {
          "id": 409361790,
          "name": "difft-aarch64-apple-darwin.tar.gz",
          "size": 12754962,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 409362702,
          "name": "difft-aarch64-pc-windows-msvc.zip",
          "size": 10959388,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-aarch64-pc-windows-msvc.zip"
        },
        {
          "id": 409362685,
          "name": "difft-aarch64-unknown-linux-gnu.tar.gz",
          "size": 12157805,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-aarch64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 409362383,
          "name": "difft-x86_64-apple-darwin.tar.gz",
          "size": 12024899,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 409362991,
          "name": "difft-x86_64-pc-windows-msvc.zip",
          "size": 11179496,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 409362400,
          "name": "difft-x86_64-unknown-linux-gnu.tar.gz",
          "size": 12401737,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-x86_64-unknown-linux-gnu.tar.gz"
        },
        {
          "id": 409362908,
          "name": "difft-x86_64-unknown-linux-musl.tar.gz",
          "size": 12453942,
          "content_type": "application/x-gtar",
          "browser_download_url": "https://github.com/Wilfred/difftastic/releases/download/0.69.0/difft-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "difft": "difft-x86_64-unknown-linux-gnu.tar.gz"
      },
      "linux-arm64": {
        "difft": "difft-aarch64-unknown-linux-gnu.tar.gz"
      },
      "darwin-x64": {
        "difft": "difft-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "difft": "difft-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "zellij-org/zellij",
      "version": "v0.44.3"
    },
    "release": {
      "tag_name": "v0.44.3",
      "assets": [
        {
          "id": 419107252,
          "name": "zellij-aarch64-apple-darwin.sha256sum",
          "size": 109,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-aarch64-apple-darwin.sha256sum"
        },
        {
          "id": 419107237,
          "name": "zellij-aarch64-apple-darwin.tar.gz",
          "size": 14997389,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 419104988,
          "name": "zellij-aarch64-unknown-linux-musl.sha256sum",
          "size": 115,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-aarch64-unknown-linux-musl.sha256sum"
        },
        {
          "id": 419104967,
          "name": "zellij-aarch64-unknown-linux-musl.tar.gz",
          "size": 17577372,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 419106295,
          "name": "zellij-no-web-aarch64-apple-darwin.sha256sum",
          "size": 109,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-aarch64-apple-darwin.sha256sum"
        },
        {
          "id": 419106279,
          "name": "zellij-no-web-aarch64-apple-darwin.tar.gz",
          "size": 11599809,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-aarch64-apple-darwin.tar.gz"
        },
        {
          "id": 419104285,
          "name": "zellij-no-web-aarch64-unknown-linux-musl.sha256sum",
          "size": 115,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-aarch64-unknown-linux-musl.sha256sum"
        },
        {
          "id": 419104274,
          "name": "zellij-no-web-aarch64-unknown-linux-musl.tar.gz",
          "size": 14179793,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-aarch64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 419106238,
          "name": "zellij-no-web-x86_64-apple-darwin.sha256sum",
          "size": 108,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-apple-darwin.sha256sum"
        },
        {
          "id": 419106227,
          "name": "zellij-no-web-x86_64-apple-darwin.tar.gz",
          "size": 11945360,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 419112558,
          "name": "zellij-no-web-x86_64-pc-windows-msvc-installer.msi",
          "size": 11194368,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-pc-windows-msvc-installer.msi"
        },
        {
          "id": 419112563,
          "name": "zellij-no-web-x86_64-pc-windows-msvc-installer.sha256sum",
          "size": 118,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-pc-windows-msvc-installer.sha256sum"
        },
        {
          "id": 419112318,
          "name": "zellij-no-web-x86_64-pc-windows-msvc.sha256sum",
          "size": 93,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-pc-windows-msvc.sha256sum"
        },
        {
          "id": 419112310,
          "name": "zellij-no-web-x86_64-pc-windows-msvc.zip",
          "size": 12836227,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 419104205,
          "name": "zellij-no-web-x86_64-unknown-linux-musl.sha256sum",
          "size": 114,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-unknown-linux-musl.sha256sum"
        },
        {
          "id": 419104188,
          "name": "zellij-no-web-x86_64-unknown-linux-musl.tar.gz",
          "size": 14594534,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-no-web-x86_64-unknown-linux-musl.tar.gz"
        },
        {
          "id": 419104522,
          "name": "zellij-x86_64-apple-darwin.sha256sum",
          "size": 108,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-apple-darwin.sha256sum"
        },
        {
          "id": 419104498,
          "name": "zellij-x86_64-apple-darwin.tar.gz",
          "size": 15581967,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-apple-darwin.tar.gz"
        },
        {
          "id": 419115064,
          "name": "zellij-x86_64-pc-windows-msvc-installer.msi",
          "size": 14163968,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-pc-windows-msvc-installer.msi"
        },
        {
          "id": 419115074,
          "name": "zellij-x86_64-pc-windows-msvc-installer.sha256sum",
          "size": 111,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-pc-windows-msvc-installer.sha256sum"
        },
        {
          "id": 419114900,
          "name": "zellij-x86_64-pc-windows-msvc.sha256sum",
          "size": 93,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-pc-windows-msvc.sha256sum"
        },
        {
          "id": 419114890,
          "name": "zellij-x86_64-pc-windows-msvc.zip",
          "size": 16268261,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-pc-windows-msvc.zip"
        },
        {
          "id": 419104868,
          "name": "zellij-x86_64-unknown-linux-musl.sha256sum",
          "size": 114,
          "content_type": "text/plain",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-unknown-linux-musl.sha256sum"
        },
        {
          "id": 419104852,
          "name": "zellij-x86_64-unknown-linux-musl.tar.gz",
          "size": 18260479,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zellij-org/zellij/releases/download/v0.44.3/zellij-x86_64-unknown-linux-musl.tar.gz"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "zellij": "zellij-x86_64-unknown-linux-musl.tar.gz"
      },
      "linux-arm64": {
        "zellij": "zellij-aarch64-unknown-linux-musl.tar.gz"
      },
      "darwin-x64": {
        "zellij": "zellij-x86_64-apple-darwin.tar.gz"
      },
      "darwin-arm64": {
        "zellij": "zellij-aarch64-apple-darwin.tar.gz"
      }
    }
  },
  {
    "pkg": {
      "repo": "zzet/gortex"
    },
    "release": {
      "tag_name": "v0.50.0",
      "assets": [
        {
          "id": 453075517,
          "name": "checksums.txt",
          "size": 995,
          "content_type": "text/plain; charset=utf-8",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/checksums.txt"
        },
        {
          "id": 453073966,
          "name": "checksums.txt.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/checksums.txt.pem"
        },
        {
          "id": 453073957,
          "name": "checksums.txt.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/checksums.txt.sig"
        },
        {
          "id": 453072880,
          "name": "gortex_darwin_amd64.tar.gz",
          "size": 50787444,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_amd64.tar.gz"
        },
        {
          "id": 453073965,
          "name": "gortex_darwin_amd64.tar.gz.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_amd64.tar.gz.pem"
        },
        {
          "id": 453073956,
          "name": "gortex_darwin_amd64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_amd64.tar.gz.sig"
        },
        {
          "id": 453072881,
          "name": "gortex_darwin_arm64.tar.gz",
          "size": 48466976,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_arm64.tar.gz"
        },
        {
          "id": 453073964,
          "name": "gortex_darwin_arm64.tar.gz.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_arm64.tar.gz.pem"
        },
        {
          "id": 453073961,
          "name": "gortex_darwin_arm64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_darwin_arm64.tar.gz.sig"
        },
        {
          "id": 453072901,
          "name": "gortex_linux_amd64.apk",
          "size": 50914434,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.apk"
        },
        {
          "id": 453073968,
          "name": "gortex_linux_amd64.apk.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.apk.pem"
        },
        {
          "id": 453073951,
          "name": "gortex_linux_amd64.apk.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.apk.sig"
        },
        {
          "id": 453072915,
          "name": "gortex_linux_amd64.deb",
          "size": 48465952,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.deb"
        },
        {
          "id": 453073959,
          "name": "gortex_linux_amd64.deb.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.deb.pem"
        },
        {
          "id": 453073955,
          "name": "gortex_linux_amd64.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.deb.sig"
        },
        {
          "id": 453072899,
          "name": "gortex_linux_amd64.rpm",
          "size": 48629243,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.rpm"
        },
        {
          "id": 453073967,
          "name": "gortex_linux_amd64.rpm.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.rpm.pem"
        },
        {
          "id": 453073954,
          "name": "gortex_linux_amd64.rpm.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.rpm.sig"
        },
        {
          "id": 453072879,
          "name": "gortex_linux_amd64.tar.gz",
          "size": 48486364,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.tar.gz"
        },
        {
          "id": 453073969,
          "name": "gortex_linux_amd64.tar.gz.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.tar.gz.pem"
        },
        {
          "id": 453073948,
          "name": "gortex_linux_amd64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_amd64.tar.gz.sig"
        },
        {
          "id": 453072898,
          "name": "gortex_linux_arm64.apk",
          "size": 48505199,
          "content_type": "application/vnd.android.package-archive",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.apk"
        },
        {
          "id": 453073963,
          "name": "gortex_linux_arm64.apk.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.apk.pem"
        },
        {
          "id": 453073949,
          "name": "gortex_linux_arm64.apk.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.apk.sig"
        },
        {
          "id": 453072912,
          "name": "gortex_linux_arm64.deb",
          "size": 46161962,
          "content_type": "application/vnd.debian.binary-package",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.deb"
        },
        {
          "id": 453073960,
          "name": "gortex_linux_arm64.deb.pem",
          "size": 3192,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.deb.pem"
        },
        {
          "id": 453073952,
          "name": "gortex_linux_arm64.deb.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.deb.sig"
        },
        {
          "id": 453072895,
          "name": "gortex_linux_arm64.rpm",
          "size": 46231467,
          "content_type": "application/x-redhat-package-manager",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.rpm"
        },
        {
          "id": 453073958,
          "name": "gortex_linux_arm64.rpm.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.rpm.pem"
        },
        {
          "id": 453073953,
          "name": "gortex_linux_arm64.rpm.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.rpm.sig"
        },
        {
          "id": 453072878,
          "name": "gortex_linux_arm64.tar.gz",
          "size": 46175607,
          "content_type": "application/gzip",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.tar.gz"
        },
        {
          "id": 453073962,
          "name": "gortex_linux_arm64.tar.gz.pem",
          "size": 3200,
          "content_type": "application/x-x509-ca-cert",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.tar.gz.pem"
        },
        {
          "id": 453073950,
          "name": "gortex_linux_arm64.tar.gz.sig",
          "size": 96,
          "content_type": "application/pgp-signature",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_linux_arm64.tar.gz.sig"
        },
        {
          "id": 453075495,
          "name": "gortex_windows_amd64.zip",
          "size": 50063302,
          "content_type": "application/zip",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_windows_amd64.zip"
        },
        {
          "id": 453075494,
          "name": "gortex_windows_amd64.zip.pem",
          "size": 3200,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_windows_amd64.zip.pem"
        },
        {
          "id": 453075493,
          "name": "gortex_windows_amd64.zip.sig",
          "size": 96,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/gortex_windows_amd64.zip.sig"
        },
        {
          "id": 453074299,
          "name": "multiple.intoto.jsonl",
          "size": 22111,
          "content_type": "application/octet-stream",
          "browser_download_url": "https://github.com/zzet/gortex/releases/download/v0.50.0/multiple.intoto.jsonl"
        }
      ]
    },
    "expected": {
      "linux-x64": {
        "gortex": "gortex_linux_amd64.tar.gz"
      },
      "linux-arm64": {
        "gortex": "gortex_linux_arm64.tar.gz"
      },
      "darwin-x64": {
        "gortex": "gortex_darwin_amd64.tar.gz"
      },
      "darwin-arm64": {
        "gortex": "gortex_darwin_arm64.tar.gz"
      }
    }
  }
] satisfies Fixture[];

describe("artifact selection fixtures", () => {
  test("covers every current package entry", () => {
    expect(FIXTURES).toHaveLength(70);
    expect(new Set(FIXTURES.map((fixture) => fixture.pkg.repo + ":" + (binariesOf(fixture.pkg)[0]?.name ?? ""))).size).toBe(70);
  });

  for (const fixture of FIXTURES) {
    for (const platformName of PLATFORMS) {
      const platform = normalizePlatform(platformName);
      for (const binary of binariesOf(fixture.pkg)) {
        const title = "selects " + (fixture.expected[platformName][binary.name] ?? "nothing") + " for " + fixture.pkg.repo + " " + binary.name + " on " + platformName;
        test(title, () => {
          const selected = selectAsset(fixture.pkg, fixture.release, platform, binary.name)?.asset.name ?? null;
          expect(selected).toBe(fixture.expected[platformName][binary.name]);
        });
      }
    }
  }
});

describe("artifact exclusion rules", () => {
  test("ignores checksum, signature, sbom, and package manager assets", () => {
    const pkg: PackageSpec = { repo: "owner/tool", binaries: [{ name: "tool" }] };
    const release: Release = {
      tag_name: "v1.0.0",
      assets: [
        { id: 1, name: "tool-v1.0.0-linux-x64.tar.gz.sha256", size: 1, browser_download_url: "https://example.invalid/sha" },
        { id: 2, name: "tool-v1.0.0-linux-x64.tar.gz.sig", size: 1, browser_download_url: "https://example.invalid/sig" },
        { id: 3, name: "tool-v1.0.0-linux-x64.spdx.json", size: 1, browser_download_url: "https://example.invalid/sbom" },
        { id: 4, name: "tool-v1.0.0-linux-x64.deb", size: 1, browser_download_url: "https://example.invalid/deb" },
        { id: 5, name: "tool-v1.0.0-linux-x64.tar.gz", size: 1, browser_download_url: "https://example.invalid/bin" }
      ]
    };
    expect(selectAsset(pkg, release, normalizePlatform("linux-x64"), "tool")?.asset.name).toBe("tool-v1.0.0-linux-x64.tar.gz");
  });

  test("rejects assets for the wrong operating system or architecture", () => {
    const pkg: PackageSpec = { repo: "owner/tool", binaries: [{ name: "tool" }] };
    const release: Release = {
      tag_name: "v1.0.0",
      assets: [
        { id: 1, name: "tool-v1.0.0-darwin-arm64.tar.gz", size: 1, browser_download_url: "https://example.invalid/darwin" },
        { id: 2, name: "tool-v1.0.0-linux-arm64.tar.gz", size: 1, browser_download_url: "https://example.invalid/arm" },
        { id: 3, name: "tool-v1.0.0-linux-x64.tar.gz", size: 1, browser_download_url: "https://example.invalid/x64" }
      ]
    };
    expect(selectAsset(pkg, release, normalizePlatform("linux-x64"), "tool")?.asset.name).toBe("tool-v1.0.0-linux-x64.tar.gz");
  });
});

describe("simple package config rules", () => {
  test("normalizes string and compact object entries", () => {
    const config = normalizeConfig({
      packages: [
        "sharkdp/fd",
        { repo: "BurntSushi/ripgrep", name: "rg", select: "x86_64-unknown-linux" },
      ],
    } satisfies ConfigFile);
    expect(config.packages[0]).toEqual({ repo: "sharkdp/fd" });
    expect(config.packages[1]).toEqual({ repo: "BurntSushi/ripgrep", binaries: [{ name: "rg" }], assetHints: { select: "x86_64-unknown-linux" } });
  });

  test("fixtures do not carry old schema fields", () => {
    expect(FIXTURES.every((fixture) => !("id" in fixture.pkg) && !("sources" in fixture.pkg))).toBe(true);
  });

  test("scoped GitHub release tags work without source metadata", () => {
    expect(candidateTags({ repo: "biomejs/biome", version: "biomejs/biome@2.5.0" })).toContain("@biomejs/biome@2.5.0");
  });

  test("GitHub releases with no binary assets stay unresolved", () => {
    const release: Release = { tag_name: "v1.0.0", assets: [] };
    const pkg: PackageSpec = { repo: "owner/tool", version: "v1.0.0", binaries: [{ name: "tool" }] };
    expect(selectAsset(pkg, release, normalizePlatform("linux-x64"), "tool")).toBeUndefined();
  });
});

describe("archive binary disambiguation", () => {
  const brootPaths = [
    "/tmp/extract/x86_64-unknown-linux-musl/broot",
    "/tmp/extract/x86_64-unknown-linux-gnu-glibc2.28/broot",
    "/tmp/extract/x86_64-unknown-linux-gnu/broot",
    "/tmp/extract/x86_64-linux-android/broot",
    "/tmp/extract/armv7-unknown-linux-musleabi/broot",
    "/tmp/extract/aarch64-unknown-linux-musl/broot",
    "/tmp/extract/aarch64-apple-darwin/broot",
  ];

  test("prefers the linux x64 binary from a multi-platform archive", () => {
    expect(choosePlatformMatch(brootPaths, normalizePlatform("linux-x64"))).toBe("/tmp/extract/x86_64-unknown-linux-musl/broot");
  });

  test("prefers the linux arm64 binary from a multi-platform archive", () => {
    expect(choosePlatformMatch(brootPaths, normalizePlatform("linux-arm64"))).toBe("/tmp/extract/aarch64-unknown-linux-musl/broot");
  });

  test("does not choose linux binaries for darwin x64", () => {
    expect(choosePlatformMatch(brootPaths, normalizePlatform("darwin-x64"))).toBeUndefined();
  });
});

describe("archive path safety", () => {
  test("allows normal relative archive paths", () => {
    expect(isSafeArchivePath("tool/bin/tool")).toBe(true);
    expect(isSafeArchivePath("x86_64-unknown-linux-gnu/broot")).toBe(true);
  });

  test("rejects absolute, parent, and windows drive paths", () => {
    expect(isSafeArchivePath("/tmp/evil")).toBe(false);
    expect(isSafeArchivePath("../evil")).toBe(false);
    expect(isSafeArchivePath("tool/../../evil")).toBe(false);
    expect(isSafeArchivePath("C:\\evil\\tool.exe")).toBe(false);
  });
});
