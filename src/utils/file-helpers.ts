/**
 * File helper utilities
 */

import fs from 'fs/promises';
import path from 'path';

export class FileHelpers {
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectory(dirPath);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  static async readJSON(filePath: string): Promise<any> {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
    }
  }

  static async writeJSON(filePath: string, data: any): Promise<void> {
    try {
      const content = JSON.stringify(data, null, 2);
      await this.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filePath}: ${error}`);
    }
  }

  static async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      if (extension) {
        return files
          .filter(file => file.endsWith(extension))
          .map(file => path.join(dirPath, file));
      }
      return files.map(file => path.join(dirPath, file));
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error}`);
    }
  }
}
