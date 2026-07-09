import type { ExtractFilesResult } from '../../types/graphql';

/**
 * Extracts File/Blob objects from variables and returns cleaned variables
 * along with a map of file paths to file objects.
 */
export function extractFiles(
  variables: Record<string, unknown>,
  path = ''
): ExtractFilesResult {
  const files = new Map<string, File | Blob>();

  function traverse(obj: unknown, currentPath: string): unknown {
    if (obj instanceof File || obj instanceof Blob) {
      files.set(currentPath, obj);
      return null; // Replace file with null in cleaned variables
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => traverse(item, `${currentPath}.${index}`));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        result[key] = traverse(value, newPath);
      }
      return result;
    }

    return obj;
  }

  const cleanedVariables = traverse(variables, path) as Record<string, unknown>;

  return { files, variables: cleanedVariables };
}
