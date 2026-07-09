/**
 * Types for GraphQL multipart file uploads
 */

/**
 * Result of extracting files from GraphQL variables
 */
export interface ExtractFilesResult {
  /** Map of file paths to File/Blob objects */
  files: Map<string, File | Blob>;
  /** Cleaned variables with files replaced by null */
  variables: Record<string, unknown>;
}

/**
 * Options for creating an upload link
 */
export interface CreateUploadLinkOptions {
  /** GraphQL endpoint URI */
  uri: string;
  /** Default headers to include with requests */
  headers?: Record<string, string>;
  /** Credentials policy for requests (e.g., 'include' for cookies) */
  credentials?: RequestCredentials;
}

/**
 * File entry for multipart form construction
 */
export interface FileEntry {
  /** Index for the form field (e.g., "0", "1") */
  index: string;
  /** The file or blob to upload */
  file: File | Blob;
  /** GraphQL variable path (e.g., "variables.file") */
  path: string;
}

/**
 * GraphQL Upload scalar type
 * Represents a file upload in GraphQL mutations
 */
export type Upload = File | Blob;
