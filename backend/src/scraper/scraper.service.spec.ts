import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ScraperService', () => {
  let service: ScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScraperService],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should scrape title and content from a URL', async () => {
    const html = `
      <html>
        <head><title>Test Title</title></head>
        <body>
          <main>
            <h1>Main Heading</h1>
            <p>This is the main content.</p>
          </main>
        </body>
      </html>
    `;
    mockedAxios.get.mockResolvedValue({ data: html });

    const result = await service.scrape('https://example.com');

    expect(result).toEqual({
      title: 'Test Title',
      content: 'Main Heading This is the main content.',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        timeout: 10000,
        maxContentLength: 10 * 1024 * 1024,
      }),
    );
  });

  it('should handle errors when scraping', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    await expect(service.scrape('https://example.com')).rejects.toThrow(
      'Failed to scrape URL',
    );
  });
});
