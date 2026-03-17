/**
 * Formal Template Schema v0.2.0
 * Defines the structure and validation rules for test templates
 */

export interface TemplateSchema {
  version: '0.2.0';
  test: TestSection;
  metadata?: MetadataSection;
  description: DescriptionSection;
  url: URLSection;
  precondition?: PreconditionSection;
  steps: StepsSection;
  expectedResults: ExpectedResultsSection;
  postcondition?: PostconditionSection;
  variables?: VariablesSection;
  notes?: NotesSection;
}

export interface TestSection {
  title: string;
}

export interface MetadataSection {
  version: '0.2.0';
  author?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low' | 'optional';
}

export interface DescriptionSection {
  text: string;
}

export interface URLSection {
  url: string;
  supportsVariables?: boolean;
}

export interface PreconditionSection {
  text: string;
}

export interface StepsSection {
  steps: Step[];
}

export interface Step {
  number: number;
  description: string;
  optional?: boolean;
}

export interface ExpectedResultsSection {
  results: string[];
}

export interface PostconditionSection {
  text: string;
}

export interface VariablesSection {
  variables: Variable[];
}

export interface Variable {
  name: string;
  value: string;
}

export interface NotesSection {
  notes: string[];
}

export interface TemplateValidationResult {
  valid: boolean;
  version: '0.1.0' | '0.2.0' | 'unknown';
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'required' | 'format' | 'validation';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export const TEMPLATE_SCHEMA_V0_2_0: TemplateSchema = {
  version: '0.2.0',
  test: {
    title: 'Test Title'
  },
  description: {
    text: 'Test description'
  },
  url: {
    url: 'https://example.com',
    supportsVariables: true
  },
  steps: {
    steps: [
      {
        number: 1,
        description: 'Step description'
      }
    ]
  },
  expectedResults: {
    results: ['Expected result']
  }
};
