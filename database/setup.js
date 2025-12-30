
/**
 * Script de Configuração do Banco de Dados
 * 
 * Para executar:
 * 1. Instale o driver: npm install pg
 * 2. Configure a variável de ambiente DATABASE_URL
 * 3. Execute: node database/setup.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Carregar variáveis de ambiente se estiver usando dotenv (opcional)
// require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agendamento_db';

const client = new Client({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!');

    const migrationPath = path.join(__dirname, 'migrations', '001_init_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executando migração inicial...');
    await client.query(sql);
    
    console.log('✅ Tabelas criadas com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
  } finally {
    await client.end();
    console.log('👋 Conexão encerrada.');
  }
}

runMigrations();
