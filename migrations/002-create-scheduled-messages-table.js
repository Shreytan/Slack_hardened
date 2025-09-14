'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scheduled_messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack user ID who scheduled the message'
      },
      channel_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Slack channel ID where message will be sent'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Message content to be sent'
      },
      scheduled_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When the message should be sent (UTC)'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'sent', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Current status of the scheduled message'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the message was actually sent'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of retry attempts'
      },
      slack_message_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Slack message ID after successful sending'
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

    // Add indexes for performance
    await queryInterface.addIndex('scheduled_messages', ['user_id'], {
      name: 'idx_scheduled_messages_user_id'
    });

    await queryInterface.addIndex('scheduled_messages', ['status'], {
      name: 'idx_scheduled_messages_status'
    });

    await queryInterface.addIndex('scheduled_messages', ['scheduled_time'], {
      name: 'idx_scheduled_messages_scheduled_time'
    });

    await queryInterface.addIndex('scheduled_messages', ['status', 'scheduled_time'], {
      name: 'idx_scheduled_messages_status_time'
    });

    await queryInterface.addIndex('scheduled_messages', ['user_id', 'created_at'], {
      name: 'idx_scheduled_messages_user_created'
    });

    console.log('✅ Scheduled messages table created with performance indexes');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('scheduled_messages');
    console.log('✅ Scheduled messages table dropped');
  }
};
