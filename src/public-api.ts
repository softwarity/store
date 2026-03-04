/*
 * Public API Surface of store
 */

// Decorator API (retrocompatible)
export {LocalStored, SessionStored} from './lib/decorator';
// Services
export {LocalStoreService, SessionStoreService, StoreService} from './lib/store.service';
// Module setup (retrocompatible)
export {StoreModule} from './lib/store.module';
// Standalone setup
export {provideStore} from './lib/provide-store';
// DI tokens
export {USER_ID} from './lib/common';
// Signals API
export {localSignal, sessionSignal} from './lib/stored-signal';
export type {StoredSignal, StoredSignalOptions} from './lib/stored-signal';
// Cross-tab sync
export {onStorageChange} from './lib/cross-tab-sync';
export type {CrossTabSyncHandle} from './lib/cross-tab-sync';
// Utilities
export {clearLocalStorage, clearSessionStorage} from './lib/storage-utils';
// SSR
export {FakeStorage} from './lib/fake-storage';
