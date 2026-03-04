import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LocalStored, SessionStored, localSignal } from '@softwarity/store';
import { registerInteractiveCode } from '@softwarity/interactive-code';

registerInteractiveCode();

interface Employee {
  name: string;
  age: number;
  email: string;
  role: string;
  status: string;
}

const EMPLOYEES: Employee[] = [
  {name: 'Alice Martin', age: 28, email: 'alice@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Bob Johnson', age: 35, email: 'bob@acme.com', role: 'Designer', status: 'Active'},
  {name: 'Charlie Brown', age: 42, email: 'charlie@acme.com', role: 'Manager', status: 'Away'},
  {name: 'Diana Prince', age: 31, email: 'diana@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Edward Norton', age: 45, email: 'edward@acme.com', role: 'Architect', status: 'Active'},
  {name: 'Fiona Green', age: 27, email: 'fiona@acme.com', role: 'Designer', status: 'Active'},
  {name: 'George Wilson', age: 38, email: 'george@acme.com', role: 'Manager', status: 'Away'},
  {name: 'Hannah Lee', age: 29, email: 'hannah@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Ivan Petrov', age: 33, email: 'ivan@acme.com', role: 'DevOps', status: 'Active'},
  {name: 'Julia Chen', age: 40, email: 'julia@acme.com', role: 'Architect', status: 'Inactive'},
  {name: 'Kevin Hart', age: 26, email: 'kevin@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Laura Palmer', age: 34, email: 'laura@acme.com', role: 'Designer', status: 'Active'},
];

@Component({
  imports: [MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent {

  readonly allColumns = [
    {key: 'name', label: 'Name'},
    {key: 'age', label: 'Age'},
    {key: 'email', label: 'Email'},
    {key: 'role', label: 'Role'},
    {key: 'status', label: 'Status'},
  ];

  private static readonly DEFAULT_CONFIG = {
    displayedColumns: ['name', 'age', 'email'],
    sortColumn: 'name',
    sortDirection: 'asc',
    pageSize: 5,
    currentPage: 0
  };

  // --- Decorator API: two configs, one per storage backend ---
  @LocalStored(1, 'demo-table-local')
  localConfig = { ...PlaygroundComponent.DEFAULT_CONFIG };

  @SessionStored('demo-table-session')
  sessionConfig = { ...PlaygroundComponent.DEFAULT_CONFIG };

  storageMode: 'LocalStored' | 'SessionStored' = 'LocalStored';

  get tableConfig() {
    return this.storageMode === 'LocalStored' ? this.localConfig : this.sessionConfig;
  }

  // --- Signals API demo ---
  protected signalPrefs = localSignal<{theme: string; lang: string}>(
    {theme: 'dark', lang: 'en'}, 1, {id: 'demo-signal-prefs'}
  );

  // --- Table helpers ---

  isColumnVisible(key: string): boolean {
    return this.tableConfig.displayedColumns.includes(key);
  }

  toggleColumn(key: string): void {
    const cols = this.tableConfig.displayedColumns;
    const idx = cols.indexOf(key);
    if (idx >= 0) {
      if (cols.length > 1) cols.splice(idx, 1);
    } else {
      cols.push(key);
    }
  }

  setSort(column: string): void {
    if (this.tableConfig.sortColumn === column) {
      this.tableConfig.sortDirection = this.tableConfig.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.tableConfig.sortColumn = column;
      this.tableConfig.sortDirection = 'asc';
    }
  }

  get sortedData(): Employee[] {
    const col = this.tableConfig.sortColumn;
    const dir = this.tableConfig.sortDirection === 'desc' ? -1 : 1;
    return [...EMPLOYEES].sort((a, b) => {
      const va = (a as any)[col];
      const vb = (b as any)[col];
      if (typeof va === 'number') return (va - (vb as number)) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  get totalPages(): number {
    return Math.ceil(EMPLOYEES.length / this.tableConfig.pageSize);
  }

  get pagedData(): Employee[] {
    const ps = this.tableConfig.pageSize;
    const page = this.tableConfig.currentPage;
    return this.sortedData.slice(page * ps, (page + 1) * ps);
  }

  getCellValue(row: Employee, key: string): string | number {
    return (row as any)[key];
  }

  setPageSize(size: number): void {
    this.tableConfig.pageSize = size;
    this.tableConfig.currentPage = 0;
  }

  prevPage(): void {
    if (this.tableConfig.currentPage > 0) {
      this.tableConfig.currentPage = this.tableConfig.currentPage - 1;
    }
  }

  nextPage(): void {
    if (this.tableConfig.currentPage < this.totalPages - 1) {
      this.tableConfig.currentPage = this.tableConfig.currentPage + 1;
    }
  }

  get storageKey(): string {
    return this.storageMode === 'LocalStored' ? 'demo-table-local' : 'demo-table-session';
  }

  get activeStorage(): Storage {
    return this.storageMode === 'LocalStored' ? localStorage : sessionStorage;
  }

  get storageBadgeLabel(): string {
    return this.storageMode === 'LocalStored' ? 'localStorage' : 'sessionStorage';
  }

  get storageContent(): string {
    const raw = this.activeStorage.getItem(this.storageKey);
    if (!raw) return '(empty)';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  setStorageMode(mode: string): void {
    this.storageMode = mode as 'LocalStored' | 'SessionStored';
  }

  resetConfig(): void {
    this.activeStorage.removeItem(this.storageKey);
    const defaults = { ...PlaygroundComponent.DEFAULT_CONFIG, displayedColumns: ['name', 'age', 'email'] };
    if (this.storageMode === 'LocalStored') {
      this.localConfig = defaults;
    } else {
      this.sessionConfig = defaults;
    }
  }

  // --- Signals helpers ---

  setTheme(theme: string): void {
    this.signalPrefs.theme = theme;
  }

  setLang(lang: string): void {
    this.signalPrefs.lang = lang;
  }

  resetSignal(): void {
    this.signalPrefs.theme = 'dark';
    this.signalPrefs.lang = 'en';
  }
}
