/**
 * Template Migrator v0.1.0 → v0.2.0
 * Converts old template format to new standardized format
 */

import { TestModel } from './test-model';

export class TemplateMigrator {
  static migrateToV0_2_0(test: TestModel): string {
    const lines: string[] = [];

    lines.push('# Test: ' + test.title);
    lines.push('');
    lines.push('## Metadata');
    lines.push(`Version: 0.2.0`);
    lines.push(`Author: (optional)`);
    lines.push(`Tags: (optional)`);
    lines.push(`Priority: (optional - high|medium|low|optional)`);
    lines.push('');
    lines.push('## Description');
    lines.push(test.description);
    lines.push('');
    lines.push('## URL');
    lines.push(test.url);
    lines.push('');
    
    if (test.precondition) {
      lines.push('## Precondition');
      lines.push(test.precondition);
      lines.push('');
    }
    
    lines.push('## Steps');
    test.steps.forEach(step => {
      lines.push(`${step.number}. ${step.description}`);
    });
    lines.push('');
    lines.push('## Expected Results');
    test.expectedResults.forEach(result => {
      lines.push(`- ${result}`);
    });
    lines.push('');
    
    if (test.postcondition) {
      lines.push('## Postcondition');
      lines.push(test.postcondition);
      lines.push('');
    }
    
    if (Object.keys(test.variables).length > 0) {
      lines.push('## Variables');
      Object.entries(test.variables).forEach(([key, value]) => {
        lines.push(`${key}=${value}`);
      });
      lines.push('');
    }
    
    if (test.notes && test.notes.length > 0) {
      lines.push('## Notes');
      test.notes.forEach(note => {
        lines.push(note);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  static getMigrationSummary(test: TestModel): { addedFields: string[]; removedFields: string[] } {
    const addedFields: string[] = [];
    const removedFields: string[] = [];

    addedFields.push('Metadata section');
    addedFields.push('Version tracking');
    
    if (!test.precondition) {
      addedFields.push('Precondition (optional)');
    }
    
    if (!test.postcondition) {
      addedFields.push('Postcondition (optional)');
    }
    
    if (!test.notes) {
      addedFields.push('Notes (optional)');
    }

    return { addedFields, removedFields };
  }

  static validateMigration(test: TestModel): boolean {
    return !!test.title && !!test.description && !!test.url && test.steps.length > 0;
  }

  static generateMigrationReport(test: TestModel): string {
    const lines: string[] = [];
    
    lines.push('=== Template Migration Report ===');
    lines.push(`Test: ${test.title}`);
    lines.push(`Source: ${test.filePath}`);
    lines.push('');
    lines.push('Migration Details:');
    lines.push('- Format: v0.1.0 → v0.2.0');
    lines.push('- Steps: ' + test.steps.length);
    lines.push('- Expected Results: ' + test.expectedResults.length);
    lines.push('- Variables: ' + Object.keys(test.variables).length);
    lines.push('');
    
    const summary = this.getMigrationSummary(test);
    
    if (summary.addedFields.length > 0) {
      lines.push('Added Sections:');
      summary.addedFields.forEach(field => {
        lines.push(`  + ${field}`);
      });
      lines.push('');
    }

    lines.push('✅ Migration completed successfully');
    
    return lines.join('\n');
  }
}
