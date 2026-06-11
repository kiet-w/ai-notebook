import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrape(url: string): Promise<{ title: string; content: string }> {
    try {
      const { data } = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // max 10MB response size
      });
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
    } catch (error) {
      throw new HttpException('Failed to scrape URL', HttpStatus.BAD_REQUEST);
    }
  }
}
