import { SCOPE } from '@/shared/config/scope'

export const battleToolsQueryKeys = {
  smogonSets: (generation = SCOPE.smogon.generation) => ['smogon', `gen${generation}`] as const,
  smogon: (formKey: string, format: string) => ['smogon', formKey, format] as const,
}
