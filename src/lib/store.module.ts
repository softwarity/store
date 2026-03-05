import {Inject, NgModule, Signal, effect, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {USER_ID} from './common';
import {StoreService} from './store.service';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [CommonModule],
  providers: [
    {provide: USER_ID, useFactory: defaultUserIdFactory}
  ]
})
export class StoreModule {
  constructor(
    @Inject(USER_ID) userIdInput: Signal<string | null> | any
  ) {
    // Duck-type: if it has .subscribe, it's an Observable (legacy)
    let sig: Signal<string | null>;
    if (typeof userIdInput?.subscribe === 'function') {
      sig = toSignal(userIdInput, {initialValue: null});
    } else {
      sig = userIdInput as Signal<string | null>;
    }
    effect(() => {
      const uid = sig();
      StoreService.userId.set(uid);
      StoreService._notifyUserIdListeners();
    });
  }
}

/** @deprecated Use provideStore() with StoreConfig instead. */
export function defaultUserIdFactory(): Signal<string | null> {
  return signal('');
}
