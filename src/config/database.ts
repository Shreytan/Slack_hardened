import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL || 'sqlite:data/slack_connect.db';
const isUsingSQLite = databaseUrl.startsWith('sqlite:');

export const sequelize = new Sequelize(databaseUrl, {
  dialect: isUsingSQLite ? 'sqlite' : 'postgres',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: false,
    timestamps: true,
  }
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await sequelize.query('SELECT 1 as test');
  } catch (error: any) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error: any) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}
