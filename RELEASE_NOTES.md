# Release Notes

## 1.19.3

---

## 1.19.2

---

## 1.19.1

### Recursive `$prop()` signals

`$prop()` reactive signals are now available at **every nesting level**, not just the top-level properties.

```typescript
// Before: only top-level signals
config.$sort()           // Signal<{column: string, direction: string}>
config.$sort().column    // read column from the signal value

// After: signals at every depth
config.sort.$column()    // Signal<string> — direct nested signal
config.sort.$direction() // Signal<string>
config.a.b.$c()          // works at any depth
```

- Signals are created lazily via the Proxy `get` trap (no overhead for unused properties)
- Stored in a closure map — invisible to `Object.keys()` / `toPlain()`
- `versionSig` is propagated through the entire tracking chain for reactivity
- Works with both decorator API (`@LocalStored` / `@SessionStored`) and function API (`localStored()` / `sessionStored()`)
- `StoredSignal<T>` type is now recursive for nested objects (arrays keep original element type for assignment compatibility)

### API rename

- `StoredOptions.id` renamed to `StoredOptions.storageKey` for clarity

### CI/CD

- `deploy-demo.yml` now builds demo from local library source instead of published NPM package
- `github-release.yml` now triggers automatically on version tags (`v*`) in addition to manual dispatch

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
