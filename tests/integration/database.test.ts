import { sequelize, connectDatabase } from '../../src/config/database';
import { User } from '../../src/models/User';
import { ScheduledMessage } from '../../src/models/ScheduledMessage';

describe('Database Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Model', () => {
    it('should create a user successfully', async () => {
      const userData = {
        slackUserId: 'U1234567890',
        teamId: 'T1234567890',
        accessToken: 'xoxb-test-token',
        teamName: 'Test Team',
        userName: 'testuser'
      };

      const user = await User.create(userData);
      
      expect(user.slackUserId).toBe(userData.slackUserId);
      expect(user.teamId).toBe(userData.teamId);
      expect(user.accessToken).toBe(userData.accessToken);
    });

    it('should enforce unique constraint on slackUserId', async () => {
      const userData = {
        slackUserId: 'U1234567890', // Same as above
        teamId: 'T0987654321',
        accessToken: 'xoxb-another-token'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('ScheduledMessage Model', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        slackUserId: 'U9876543210',
        teamId: 'T9876543210',
        accessToken: 'xoxb-test-token-2'
      });
    });

    it('should create a scheduled message successfully', async () => {
      const messageData = {
        userId: testUser.slackUserId,
        channelId: 'C1234567890',
        message: 'Test scheduled message',
        scheduledTime: new Date(Date.now() + 60000), // 1 minute from now
        status: 'pending' as const
      };

      const scheduledMessage = await ScheduledMessage.create(messageData);
      
      expect(scheduledMessage.userId).toBe(messageData.userId);
      expect(scheduledMessage.message).toBe(messageData.message);
      expect(scheduledMessage.status).toBe('pending');
      expect(scheduledMessage.retryCount).toBe(0);
    });
  });
});
