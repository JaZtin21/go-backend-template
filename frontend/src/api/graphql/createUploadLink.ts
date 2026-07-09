import { ApolloLink, Observable } from '@apollo/client';
import type { Operation } from '@apollo/client';
import { print } from 'graphql';
import { extractFiles } from './extractFiles';
import type { CreateUploadLinkOptions, FileEntry } from '../../types/graphql';

/**
 * Custom upload link for Apollo Client that handles multipart file uploads.
 * Compatible with Vite and the graphql-multipart-request-spec.
 */
export function createUploadLink(options: CreateUploadLinkOptions): ApolloLink {
  const { uri, headers: defaultHeaders = {}, credentials } = options;

  return new ApolloLink((operation: Operation) => {
    return new Observable((observer) => {
      const { query, variables, operationName } = operation;
      const context = operation.getContext();
      const contextHeaders = context.headers || {};

      const { files, variables: cleanedVariables } = extractFiles(variables);

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          ...contextHeaders,
        },
        credentials: credentials || 'same-origin',
      };

      let body: BodyInit;

      if (files.size > 0) {
        // Multipart upload - ORDER MATTERS for gqlgen: operations, map, then files
        const formData = new FormData();
        
        // 1. Operations (query, variables)
        const operations = JSON.stringify({
          query: print(query),
          variables: cleanedVariables,
          operationName,
        });
        formData.append('operations', operations);

        // 2. Build map first (but DON'T append yet)
        const map: Record<string, string[]> = {};
        const fileEntries: FileEntry[] = [];
        let i = 0;
        files.forEach((file: File | Blob, path: string) => {
          const graphqlPath = path.startsWith('variables.') ? path : `variables.${path}`;
          map[i.toString()] = [graphqlPath];
          fileEntries.push({ index: i.toString(), file, path: graphqlPath });
          i++;
        });
        
        // 3. Append map (second)
        formData.append('map', JSON.stringify(map));

        // 4. Append files last (third)
        fileEntries.forEach(({ index, file }) => {
          formData.append(index, file as Blob, (file as File).name);
        });

        body = formData;
        // Don't set Content-Type, let browser set it with boundary
        delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
      } else {
        // Regular JSON request
        body = JSON.stringify({
          query: print(query),
          variables: cleanedVariables,
          operationName,
        });
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      fetchOptions.body = body;

      fetch(uri, fetchOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Network error: ${response.status}`);
          }
          return response.json();
        })
        .then((result) => {
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  });
}
