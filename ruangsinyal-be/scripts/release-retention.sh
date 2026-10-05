#!/usr/bin/env bash

validate_release_retention() {
  if [[ ! "$1" =~ ^[1-9][0-9]*$ ]]; then
    echo "KEEP_RELEASES must be a positive integer" >&2
    return 1
  fi
}

prune_backend_releases() {
  local root keep build previous current entry target retained=0
  root="$(realpath -e -- "$1")" || return 1
  keep="$2"
  validate_release_retention "$keep" || return 1
  build="$(realpath -e -- "$3")" || return 1
  previous="${4:-}"
  current="$(realpath -e -- "$root/current")" || return 1
  if [[ ! -d "$current" || ! -d "$build" || "$(dirname -- "$current")" != "$root" || "$(dirname -- "$build")" != "$root" ]]; then
    echo "Refusing cleanup: active/build release is outside the release root or missing" >&2
    return 1
  fi

  local -a candidates=()
  while IFS= read -r -d '' entry; do
    target="${entry#* }"
    if [[ "$target" == "$current" || "$target" == "$build" || "$target" == "$previous" ]]; then
      retained=$((retained + 1))
    else
      candidates+=("$target")
    fi
  done < <(find "$root" -maxdepth 1 -mindepth 1 -type d -name 'build-*' -printf '%T@ %p\0' | sort -z -nr)

  # Keep the active build and its rollback even when KEEP_RELEASES is only one.
  for target in "${candidates[@]}"; do
    if (( retained < keep )); then
      retained=$((retained + 1))
      continue
    fi
    # Recheck containment and current immediately before recursive deletion.
    current="$(realpath -e -- "$root/current")" || return 1
    if [[ -L "$target" || "$(dirname -- "$(realpath -e -- "$target")")" != "$root" || "$(basename -- "$target")" != build-* ]]; then
      echo "Refusing unsafe release cleanup: $target" >&2
      return 1
    fi
    if [[ "$target" == "$current" || "$target" == "$build" || "$target" == "$previous" ]]; then
      continue
    fi
    if ! rm -rf -- "$target" 2>/dev/null; then
      if ! sudo -n rm -rf -- "$target"; then
        echo "warning: failed to remove old release $target" >&2
      fi
    fi
  done
}
