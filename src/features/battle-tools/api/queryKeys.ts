import { SMOGON_FORMAT_GEN } from '@/shared/config/scope'

export const battleToolsQueryKeys = {
  smogonSets: () => ['smogon', SMOGON_FORMAT_GEN] as const,
  smogon: (formKey: string, format: string) => ['smogon', formKey, format] as const,
}
