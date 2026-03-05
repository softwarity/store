import {Injectable, signal, WritableSignal} from '@angular/core';
import {FakeStorage} from './fake-storage';

export abstract class StoreService {

  static userId: WritableSignal<string | null> = signal(null);

  private static _userIdListeners = new Set<(userId: string | null) => void>();

  static onUserIdChange(cb: (userId: string | null) => void): () => void {
    StoreService._userIdListeners.add(cb);
    return () => StoreService._userIdListeners.delete(cb);
  }

  static _notifyUserIdListeners(): void {
    const uid = StoreService.userId();
    StoreService._userIdListeners.forEach(cb => cb(uid));
  }

  static getId(userId: string | null, target: { constructor: { name: string } }, key: string, id?: string) {
    const suffix = id || `${target.constructor.name}.${key}`;
    if (userId !== null && userId.length > 0) {
      return `${userId}_${suffix}`;
    }
    return suffix;
  }

  abstract getStorage(): Storage;

  loadCfg(cfg: any): any {
    let currentCfg: any = cfg;
    const entry: string | null = this.getStorage().getItem(`${cfg.id}`);
    if (entry !== null) {
      try {
        const fromStore: any = JSON.parse(entry);
        // Remap _schemaVersion → version for in-memory use
        if (fromStore._schemaVersion !== undefined) {
          fromStore.version = fromStore._schemaVersion;
          delete fromStore._schemaVersion;
        }
        if (currentCfg.version === undefined || currentCfg.version === fromStore.version) {
          currentCfg = fromStore;
        } else {
          this.saveCfg(currentCfg);
        }
      } catch {
        this.getStorage().removeItem(`${cfg.id}`);
      }
    }
    const res = this.transformObject(currentCfg);
    const toJson = this.toJson.bind(this);
    res.toJson = () => {
      return toJson(res, 'toJson', 'version', 'id');
    };
    return res;
  }

  private transformObject(obj: any, root?: any) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    const res: any = {};
    const innerObject: Record<string, any> = {};
    Object.keys(obj).forEach((key: string) => {
      if (key === 'version' || key === 'id') { // readonly
        innerObject[key] = obj[key];
        Object.defineProperty(res, key, {
          enumerable: true,
          get: () => innerObject[key]
        });
      } else {
        innerObject[key] = this.transform(obj[key], root || res);
        Object.defineProperty(res, key, {
          enumerable: true,
          get: () => innerObject[key],
          set: (v: any) => {
            innerObject[key] = this.transform(v, root || res);
            this.saveCfg(root || res);
          }
        });
      }
    });
    return res;
  }

  private transform(value: any, root: any) {
    if (value instanceof Array) {
      return this.transformArray(value, root);
    } else if (typeof value === 'object') {
      return this.transformObject(value, root);
    } else {
      return value;
    }
  }

  private transformArray(arr: any[], root: any): any[] {
    const transformArray = this.transformArray.bind(this);
    const transformObject = this.transformObject.bind(this);
    const transformArr = arr.map(item => (item instanceof Array ? transformArray(item, root) : transformObject(item, root)));
    ['push', 'pop', 'shift', 'unshift', 'copyWithin', 'fill', 'reverse', 'sort', 'splice'].forEach((method: string) => {
      (transformArr as any)[method] = (...args: any) => {
        const original = Array.prototype[method as keyof typeof Array.prototype] as Function;
        const res = original.apply(transformArr, args);
        this.saveCfg(root);
        return res;
      };
    });
    return transformArr;
  }

  private saveCfg(root: any) {
    try {
      const json = this.toJson(root);
      // Rename version → _schemaVersion for storage
      if (json && json.version !== undefined) {
        json._schemaVersion = json.version;
        delete json.version;
      }
      this.getStorage().setItem(`${root.id}`, JSON.stringify(json));
    } catch (e) {
      console.warn(`@softwarity/store: Failed to save (key: ${root.id}).`, e);
    }
  }

  private toJson(ori: any, ...excludes: string[]) {
    if (!ori || typeof ori !== 'object') {
      return ori;
    }
    const toJson = this.toJson.bind(this);
    let res;
    if (ori instanceof Array) {
      res = [];
      ori.forEach((item: any) => {
        res.push(toJson(item));
      });
    } else if (typeof ori === 'object') {
      res = Object.keys(ori)
        .filter(key => excludes.indexOf(key) === -1) // excludes
        .reduce((r, key) => this.addJson(r, key, ori[key]), {}); // transform to json
    } else {
    }
    return res;
  }

  private addJson(obj: any, key: string, value: any) {
    obj[key] = (value !== null && value !== undefined) ? this.toJson(value) : value;
    return obj;
  }
}

@Injectable()
export class LocalStoreService extends StoreService {

  getStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return new FakeStorage();
    } else {
      return localStorage;
    }
  }
}

@Injectable()
export class SessionStoreService extends StoreService {

  getStorage() {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return new FakeStorage();
    } else {
      return sessionStorage;
    }
  }
}
