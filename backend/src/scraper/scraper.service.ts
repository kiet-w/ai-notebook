import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { safeHttpAgent, safeHttpsAgent } from './utils/ssrf.util';

@Injectable()
export class ScraperService {
  async scrape(url: string): Promise<{ title: string; content: string }> {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid URL protocol');
      }

      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // max 10MB response size
        httpAgent: safeHttpAgent,
        httpsAgent: safeHttpsAgent,
      });
      const data = response.data as string | Buffer;
      const $ = cheerio.load(data);

      const title = $('title').text().trim() || 'No Title';

      // Try to find main content
      let content =
        $('main').text().trim() ||
        $('article').text().trim() ||
        $('body').text().trim();

      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();

      return { title, content };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? `Failed to scrape URL: ${err.message}`
          : 'Failed to scrape URL';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
