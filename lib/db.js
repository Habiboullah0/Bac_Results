import Database from 'better-sqlite3';
import path from 'path';

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'data', 'bac_results.sqlite');
    
    dbInstance = new Database(dbPath, { readonly: true, fileMustExist: true });
    
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('temp_store = MEMORY');
    dbInstance.pragma('cache_size = -2000');
  }
  return dbInstance;
}