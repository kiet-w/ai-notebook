import { Test, TestingModule } from '@nestjs/testing';
import { MarkitdownService } from './markitdown.service';
import { exec } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
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
      const mockStdout = '# Test Document\n\nThis is a mock converted markdown.';
      const mockStderr = '';
      
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => {
        cb(null, { stdout: mockStdout, stderr: mockStderr });
      });

      const result = await service.convert('/path/to/test.pdf');
      
      expect(exec).toHaveBeenCalled();
      expect(result).toBe(mockStdout);
    });

    it('should throw error when command fails', async () => {
      const mockError = new Error('Execution failed');
      
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => {
        cb(mockError, null);
      });

      await expect(service.convert('/path/to/test.pdf')).rejects.toThrow(
        'Failed to convert file to markdown: Execution failed',
      );
    });
  });
});
