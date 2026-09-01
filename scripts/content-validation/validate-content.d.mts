export interface ContentValidationResult {
  filesChecked: number;
  errors: string[];
}

export interface ContentValidationOptions {
  publicRoot?: string;
}

export function validateContentRoot(
  contentRoot: string,
  options?: ContentValidationOptions | string,
): Promise<ContentValidationResult>;
