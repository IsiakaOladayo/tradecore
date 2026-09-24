const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Connect to RDS using the environment variables already in your ECS Task
  const client = new Client({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: 5432,
    // Enable SSL since RDS PostgreSQL requires it by default in production
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Successfully connected to RDS PostgreSQL.');

    // Read your SQL file (which was baked into the Docker image)
    const sqlPath = path.join(__dirname, 'migrations', '../../../database/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the raw SQL against your RDS Database
    console.log('Executing SQL migration script...');
    await client.query(sql);

    console.log('Migration completed successfully!');
    process.exit(0); // Tell Fargate the task succeeded so it can shut down
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1); // Tell Fargate it failed so your GitHub pipeline stops
  }
}

runMigration();

