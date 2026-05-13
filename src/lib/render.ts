export interface VariableConfig {
  key: string
  label: string
  type: 'text' | 'select'
  options?: string[]
  placeholder?: string
}

export const extractVariables = (body: string): string[] => {
  const matches = body.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  const keys = matches.map((m) => m.slice(2, -2))
  return [...new Set(keys)]
}

export const renderPrompt = (
  body: string,
  values: Record<string, string>,
): string => {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] ?? `{{${key}}}`
  })
}

export const autoLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const detectUnfilled = (
  body: string,
  values: Record<string, string>,
): string[] => {
  const vars = extractVariables(body)
  return vars.filter((v) => !values[v] || values[v].trim() === '')
}
