export interface ContentValidationResult {
  filesChecked: number;
  errors: string[];
}

export function validateContentRoot(contentRoot: string): Promise<ContentValidationResult>;
