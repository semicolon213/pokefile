export const battleToolsQueryKeys = {
  smogonSets: () => ['smogon', 'gen6'] as const,
  smogon: (formKey: string, format: string) => ['smogon', formKey, format] as const,
}
