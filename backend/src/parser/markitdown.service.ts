import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class MarkitdownService {
  private readonly logger = new Logger(MarkitdownService.name);

  // Resolve the markitdown executable path relative to process.cwd() or fallback to absolute path
  private readonly markitdownPath = path.resolve(
    process.cwd(),
    '../.venv/bin/markitdown',
  );

  async convert(filePath: string): Promise<string> {
    this.logger.log(`Converting file to Markdown: ${filePath}`);
    try {
      // Execute CLI: markitdown <filePath> using execFile to prevent injection
      const { stdout, stderr } = await execFileAsync(this.markitdownPath, [
        filePath,
      ]);

      if (stderr && stderr.trim().length > 0) {
        this.logger.warn(`markitdown stderr: ${stderr}`);
      }

      return stdout;
    } catch (error) {
      this.logger.error(`Failed to convert file ${filePath}: ${error.message}`);
      throw new Error(`Failed to convert file to markdown: ${error.message}`);
    }
  }
}
