import { Test, TestingModule } from '@nestjs/testing';
import { MarkitdownService } from './markitdown.service';
import { execFile } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

describe('MarkitdownService', () => {
  let service: MarkitdownService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarkitdownService],
    }).compile();

    service = module.get<MarkitdownService>(MarkitdownService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert', () => {
    it('should successfully convert file to markdown', async () => {
      const mockStdout =
        '# Test Document\n\nThis is a mock converted markdown.';
      const mockStderr = '';

      (execFile as unknown as jest.Mock).mockImplementation((cmd, args, cb) => {
        // cb is the third argument in execFile signature
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const callback: (...args: unknown[]) => void =
          typeof args === 'function' ? args : cb;

        callback(null, { stdout: mockStdout, stderr: mockStderr });
      });

      const result = await service.convert('/path/to/test.pdf');

      expect(execFile).toHaveBeenCalled();
      expect(result).toBe(mockStdout);
    });

    it('should throw error when command fails', async () => {
      const mockError = new Error('Execution failed');

      (execFile as unknown as jest.Mock).mockImplementation((cmd, args, cb) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const callback: (...args: unknown[]) => void =
          typeof args === 'function' ? args : cb;

        callback(mockError, null);
      });

      await expect(service.convert('/path/to/test.pdf')).rejects.toThrow(
        'Failed to convert file to markdown: Execution failed',
      );
    });
  });
});
