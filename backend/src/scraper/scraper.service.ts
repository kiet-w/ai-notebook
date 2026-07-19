import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dns from 'dns';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    return (
      ip === '::1' ||
      ip.startsWith('fe80:') ||
      ip.startsWith('fc00:') ||
      ip.startsWith('fd')
    );
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 ||
    parts[0] === 169 ||
    parts[0] === 0
  );
}

const safeLookup = (
  hostname: string,
  options: dns.LookupOptions,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string,
    family: number,
  ) => void,
) => {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err, address, family);
    if (isPrivateIp(address)) {
      return callback(
        new Error('SSRF blocked: private IP detected') as NodeJS.ErrnoException,
        '',
        0,
      );
    }
    callback(null, address, family);
  });
};

const safeHttpAgent = new http.Agent({ lookup: safeLookup });
const safeHttpsAgent = new https.Agent({ lookup: safeLookup });

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
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to scrape URL',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
