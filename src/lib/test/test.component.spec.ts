import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TestComponent} from './test.component';
import {StoreService} from '../store.service';
import {provideStore} from '../provide-store';
import {signal} from '@angular/core';

describe('Test LocalStored', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    StoreService.userId.set(null);
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        provideStore({userId: () => signal('USER')})
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.flushEffects();
  });

  afterEach(() => localStorage.clear());

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('Test LocalStored', () => {
    component.local.foo = 6;
    const stored = JSON.parse(localStorage.getItem('USER_test0') || '');
    expect(component.local.foo).toEqual(6);
    expect(stored.foo).toEqual(6);
  });

  it('should expose $-prefixed signal on decorated property', () => {
    expect((component.local as any).$foo()).toEqual(5);
    component.local.foo = 42;
    expect((component.local as any).$foo()).toEqual(42);
  });

  it('should track direct array index assignment via decorator', () => {
    component.localArr.items[0] = 'z';
    const stored = JSON.parse(localStorage.getItem('USER_test-arr') || '{}');
    expect(stored.items[0]).toBe('z');
  });
});
describe('Test SessionStored', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    StoreService.userId.set(null);
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        provideStore({userId: () => signal('USER')})
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.flushEffects();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('Test SessionStored', () => {
    component.session.foo = 6;
    const stored = JSON.parse(sessionStorage.getItem('USER_test') || '');
    expect(component.session.foo).toEqual(6);
    expect(stored.foo).toEqual(6);
    sessionStorage.clear();
  });

  it('SessionStored deep nested mutation persists', () => {
    component.session.foo = 10;
    const stored = JSON.parse(sessionStorage.getItem('USER_test') || '');
    expect(stored.foo).toEqual(10);
    sessionStorage.clear();
  });
});

describe('Test LocalStored reads pre-existing storage', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    // Pre-populate localStorage with a previously saved value (including id, as saveCfg does)
    localStorage.setItem('USER_test0', JSON.stringify({_schemaVersion: 1, id: 'USER_test0', foo: 42}));

    StoreService.userId.set(null);
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        provideStore({userId: () => signal('USER')})
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.flushEffects();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should load previously persisted value from localStorage', () => {
    expect(component.local.foo).toEqual(42);
  });

  it('should update persisted value after mutation', () => {
    component.local.foo = 99;
    const stored = JSON.parse(localStorage.getItem('USER_test0') || '');
    expect(stored.foo).toEqual(99);
  });
});
