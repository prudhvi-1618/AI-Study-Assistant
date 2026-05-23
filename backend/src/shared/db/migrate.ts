import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './mysql.js';
import { logger } from '../logger/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the migrations directory
const getMigrationsDir = (): string => {
  const pathsToTry = [
    path.join(__dirname, 'migrations'),
    path.join(process.cwd(), 'src', 'shared', 'db', 'migrations'),
    path.join(process.cwd(), 'dist', 'shared', 'db', 'migrations'),
    path.join(process.cwd(), 'backend', 'src', 'shared', 'db', 'migrations'),
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('Could not find migrations directory in any of the expected locations.');
};

export const runMigrations = async (): Promise<void> => {
  let connection;
  try {
    const migrationsDir = getMigrationsDir();
    logger.info(`Using migrations directory: ${migrationsDir}`);

    connection = await pool.getConnection();

    // 1. Create _migrations metadata table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already executed migrations
    const [rows] = await connection.query('SELECT name FROM _migrations') as any[];
    const executedMigrations = new Set<string>(rows.map((row: any) => row.name));

    // 3. Read and sort migration files from the directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${files.length} migration files.`);

    // 4. Run pending migrations
    for (const file of files) {
      if (executedMigrations.has(file)) {
        logger.info(`Migration ${file} is already applied. Skipping.`);
        continue;
      }

      logger.info(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Split statements by semicolon and filter out empty or comment lines
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => {
          if (!stmt) return false;
          // Filter out full-line comments
          const lines = stmt.split('\n').map(l => l.trim());
          const isAllComments = lines.every(l => l.startsWith('--') || l.startsWith('/*') || l.length === 0);
          return !isAllComments;
        });

      // Run each statement in the file
      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          await connection.query(statement);
        }
        
        // Record migration execution
        await connection.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
        await connection.commit();
        logger.info(`Migration ${file} completed successfully.`);
      } catch (err) {
        await connection.rollback();
        logger.error(`Migration ${file} failed! Rolling back changes. Error:`, err);
        throw err;
      }
    }

    logger.info('All migrations have been executed successfully.');
  } catch (error) {
    logger.error('Failed to run migrations:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Check if this script is executed directly
const runSelf = async () => {
  const isDirectRun = process.argv[1] && (
    process.argv[1].endsWith('migrate.ts') || 
    process.argv[1].endsWith('migrate.js') ||
    process.argv[1].endsWith('runMigrations.ts')
  );

  if (isDirectRun || process.env.RUN_MIGRATIONS === 'true') {
    try {
      logger.info('Starting standalone migration run...');
      await runMigrations();
      logger.info('Standalone migrations complete. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('Standalone migration execution failed:', err);
      process.exit(1);
    }
  }
};

runSelf();
