export interface FlowStep {
  id: string;
  question?: string;
  title?: string;
  type?: 'string' | 'int' | 'float' | 'choice' | 'boolean' | 'file' | 'address';
  options?: (string | number)[];
  logos?: string[];
  required?: boolean;
  required_when?: string;
  allowed_extensions?: string[];
  max_mb?: number;
  multiple?: boolean;
  help_text?: string;
  example?: string;
  cost_info?: string;
  contact_info?: string;
  next?: string | NextCondition[];
  result?: string;
  action?: string;
  terminate?: boolean;
}

export interface NextCondition {
  condition?: string;
  goto?: string;
  default?: string;
}

export interface FlowDefinition {
  flow_version: string;
  steps: FlowStep[];
}

export interface FormData {
  [stepId: string]: any;
}

export interface UploadedFile {
  file: File;
  stepId: string;
  name: string;
  size: number;
  type: string;
} 