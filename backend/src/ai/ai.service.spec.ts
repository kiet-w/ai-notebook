import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { Category } from '@prisma/client';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analyze content and return structured data', async () => {
    const mockResponse = {
      text: JSON.stringify({
        title: 'Mocked Note Title',
        summary: 'This is a mocked summary.',
        bullets: ['point 1', 'point 2'],
        category: 'TECH',
      }),
    };
    jest
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .spyOn((service as any).ai.models, 'generateContent')
      .mockResolvedValue(mockResponse);

    const content = 'Some content to analyze';
    const result = await service.analyze(content);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('category');
    expect(Object.values(Category)).toContain(result.category);
  });
});
