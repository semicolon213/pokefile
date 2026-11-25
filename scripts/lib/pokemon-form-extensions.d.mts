import type { PokemonForm } from '../../src/shared/models/pokemon'

export const FORM_EXTENSION_SPECIES: readonly { id: number; name: string; keys: readonly string[] }[]

export function fetchFormExtensions(
  getJson: (url: string) => Promise<unknown>,
  basePokemon?: ReadonlyMap<number, { id: number; name: string; forms: { name: string; url: string }[] }>,
): Promise<Map<number, PokemonForm[]>>

export function mergeFormExtensions<T extends { version: number; pokemon: { id: number; forms: readonly PokemonForm[] }[] }>(
  index: T,
  extensions: ReadonlyMap<number, readonly PokemonForm[]>,
  generatedAt?: string,
): Omit<T, 'pokemon' | 'generatedAt'> & {
  generatedAt: string
  pokemon: (Omit<T['pokemon'][number], 'forms'> & { forms: PokemonForm[] })[]
}
