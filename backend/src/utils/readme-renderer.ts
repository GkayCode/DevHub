export interface ReadmeVariables {
  [key: string]: string;
}

export interface ReadmeRenderResult {
  content: string;
  missingVariables: string[];
}

export function renderReadmeTemplate(
  template: string,
  variables: ReadmeVariables
): ReadmeRenderResult {
  const content = template.replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (placeholder, key: string) => {
      return Object.prototype.hasOwnProperty.call(variables, key)
        ? variables[key]
        : placeholder;
    }
  );

  const missingVariables = Array.from(
    content.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g),
    (match) => match[1]
  );

  return {
    content,
    missingVariables: [...new Set(missingVariables)],
  };
}