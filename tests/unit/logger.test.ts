import { logger, logHelpers } from '../../src/logger';

describe('Logger', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

  afterEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should log messages with appropriate levels', () => {
    logger.info('Test info message');
    logger.error('Test error message');
    logger.warn('Test warning message');
    
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should use component-specific logging helpers', () => {
    logHelpers.auth('Authentication event', { userId: 'U123' });
    logHelpers.slack('Slack API call', { channel: 'C123' });
    logHelpers.security('Security event', { ip: '127.0.0.1' });
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});
