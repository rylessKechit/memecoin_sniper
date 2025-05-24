// src/types/sql.d.ts
// Types pour sql.js

declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): any[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  interface Statement {
    step(): boolean;
    getAsObject(): { [key: string]: any };
    bind(params: any[]): void;
    run(params?: any[]): void;
    free(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  function initSqlJs(): Promise<SqlJsStatic>;
  export = initSqlJs;
}