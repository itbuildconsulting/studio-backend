import app from './app';
import { startLevelUpdateJob } from './jobs/levelUpdateJob';
import sequelize from './config/database';

const PORT = process.env.PORT || 3000;

async function runMigrations() {
  try {
    await sequelize.query(`
      ALTER TABLE classStudent
      ADD COLUMN checkin_at DATETIME NULL AFTER checkin
    `);
    console.log('[Migration] checkin_at adicionado à tabela classStudent');
  } catch (err: any) {
    if (err?.original?.code === 'ER_DUP_FIELDNAME') {
      console.log('[Migration] checkin_at já existe, pulando');
    } else {
      console.error('[Migration] Erro ao adicionar checkin_at:', err);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await runMigrations();
  startLevelUpdateJob();
});
