import {InjectionToken, Signal} from '@angular/core';

export const USER_ID = new InjectionToken<Signal<string | null>>('UserId');
