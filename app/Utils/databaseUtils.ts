import * as SQLite from 'expo-sqlite';

let databaseInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return databaseInstance!;
  }

  isInitializing = true;

  try {
    databaseInstance = await SQLite.openDatabaseAsync('notifications.db', {
      useNewConnection: true,
    });

    // Configure database for better performance and concurrency
    await databaseInstance.execAsync(`PRAGMA journal_mode = WAL;`);
    await databaseInstance.execAsync(`PRAGMA foreign_keys = ON;`);
    await databaseInstance.execAsync(`PRAGMA synchronous = NORMAL;`);
    await databaseInstance.execAsync(`PRAGMA cache_size = 10000;`);
    await databaseInstance.execAsync(`PRAGMA temp_store = MEMORY;`);

    isInitializing = false;
    return databaseInstance;
  } catch (error) {
    isInitializing = false;
    console.error('[Database] Failed to open database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (databaseInstance) {
    try {
      await databaseInstance.closeAsync();
      databaseInstance = null;
    } catch (error) {
      console.error('[Database] Error closing database:', error);
    }
  }
};

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (error.message?.includes('database is locked')) {
        console.log(`[Database] Locked on attempt ${attempt}, retrying...`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
};

export const executeTransaction = async <T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> => {
  const database = await getDatabase();

  try {
    await database.execAsync('BEGIN IMMEDIATE TRANSACTION;');
    const result = await operation(database);
    await database.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
};
