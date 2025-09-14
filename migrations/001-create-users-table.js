'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      slack_user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      team_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'AES-256-GCM encrypted access token'
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'AES-256-GCM encrypted refresh token'
      },
      token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      team_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['slack_user_id'], {
      name: 'idx_users_slack_user_id',
      unique: true
    });

    await queryInterface.addIndex('users', ['team_id'], {
      name: 'idx_users_team_id'
    });

    await queryInterface.addIndex('users', ['token_expires_at'], {
      name: 'idx_users_token_expires_at'
    });

    console.log('✅ Users table created with encryption support');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    console.log('✅ Users table dropped');
  }
};
