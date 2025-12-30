/**
 * Script de Configuração do Banco de Dados - Q-Barber
 * 
 * Este script executa todas as migrações SQL na pasta migrations/
 * em ordem numérica (001_, 002_, etc.)
 * 
 * Para executar:
 * 1. Instale o driver: npm install pg
 * 2. Configure a variável de ambiente DATABASE_URL ou edite a string de conexão abaixo
 * 3. Execute: node database/setup.js
 * 
 * Exemplo de DATABASE_URL:
 * postgresql://usuario:senha@localhost:5432/qbarber_db
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Carregar variáveis de ambiente se estiver usando dotenv (opcional)
// require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qbarber_db';

const client = new Client({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Obtém todas as migrações em ordem
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Criando diretório de migrações...');
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ordena alfabeticamente (001_, 002_, etc.)

  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file)
  }));
}

/**
 * Cria tabela de controle de migrações se não existir
 */
async function ensureMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await client.query(createTableSQL);
}

/**
 * Verifica se uma migração já foi executada
 */
async function isMigrationExecuted(migrationName) {
  const result = await client.query(
    'SELECT COUNT(*) FROM _migrations WHERE name = $1',
    [migrationName]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Registra uma migração como executada
 */
async function recordMigration(migrationName) {
  await client.query(
    'INSERT INTO _migrations (name) VALUES ($1)',
    [migrationName]
  );
}

/**
 * Executa todas as migrações pendentes
 */
async function runMigrations() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    console.log(`   URL: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
    await client.connect();
    console.log('✅ Conectado!\n');

    // Garante que a tabela de controle existe
    await ensureMigrationsTable();

    // Obtém todas as migrações
    const migrations = getMigrationFiles();

    if (migrations.length === 0) {
      console.log('⚠️  Nenhuma migração encontrada na pasta migrations/');
      return;
    }

    console.log(`📋 ${migrations.length} migração(ões) encontrada(s)\n`);

    let executed = 0;
    let skipped = 0;

    for (const migration of migrations) {
      const alreadyExecuted = await isMigrationExecuted(migration.name);

      if (alreadyExecuted) {
        console.log(`⏭️  Pulando: ${migration.name} (já executada)`);
        skipped++;
        continue;
      }

      console.log(`🚀 Executando: ${migration.name}...`);

      try {
        const sql = fs.readFileSync(migration.path, 'utf8');

        // Executa em uma transação
        await client.query('BEGIN');
        await client.query(sql);
        await recordMigration(migration.name);
        await client.query('COMMIT');

        console.log(`   ✅ Sucesso!\n`);
        executed++;
      } catch (migrationError) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Erro na migração ${migration.name}:`);
        console.error(`   ${migrationError.message}`);
        throw migrationError;
      }
    }

    console.log('\n========================================');
    console.log(`📊 Resumo:`);
    console.log(`   - Executadas: ${executed}`);
    console.log(`   - Puladas: ${skipped}`);
    console.log(`   - Total: ${migrations.length}`);
    console.log('========================================');
    console.log('\n✅ Migrações concluídas com sucesso!');

  } catch (err) {
    console.error('\n❌ Erro durante as migrações:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Conexão encerrada.');
  }
}

/**
 * Comando para resetar o banco (CUIDADO: apaga todos os dados!)
 */
async function resetDatabase() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('⚠️  ATENÇÃO: Isso irá apagar TODOS os dados do banco!');
    console.log('   Aguarde 5 segundos para cancelar (Ctrl+C)...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Removendo todas as tabelas...');

    // Remove todas as tabelas
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Remove tipos ENUM
    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typcategory = 'E') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log('✅ Banco de dados resetado!\n');
    console.log('Execute "node database/setup.js" para recriar as tabelas.');

  } catch (err) {
    console.error('❌ Erro ao resetar banco:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Verifica argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--reset')) {
  resetDatabase();
} else {
  runMigrations();
}
