# Release Notes

## 1.19.1

---

## 1.19.0

### Native Proxy deep tracking

Migrated `createTrackedObject` and `createTrackedArray` from `Object.defineProperty` / array method wrapping to native `Proxy` with `get`/`set` traps.

**New capabilities:**
- Direct array index assignment: `config.columns[0] = 'email'` now triggers a save
- New property on nested objects: `config.sort.newProp = 'value'` now triggers a save
- Array length truncation: `config.columns.length = 0` now triggers a save
- `TRACKED` symbol prevents double-wrapping during `sort()`/`reverse()`

### Documentation & demo

- Separated Setup and User-scoped storage into distinct sections
- Renamed "Version management" to "Schema version management"
- Added module-based userId example with `USER_ID` token
- Clarified storage key format table (renamed "Signals" to "Stored functions")
- Playground converted to signal-based architecture (`computed()` for `pagedData`, `displayedColumns`, etc.)
- Updated descriptions to focus on persisting user choices and restoring them on reload
- Added Catppuccin theme for interactive-code blocks

### CI/CD

- Release workflow now supports patch/minor/major via `workflow_dispatch`
- Tag workflow publishes to NPM and creates GitHub Release with notes from `RELEASE_NOTES.md`

---
