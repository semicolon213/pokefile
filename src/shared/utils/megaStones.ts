import type { FormKey } from '@/shared/models'
import { toShowdownId } from './showdown'

// ADR-009 / CR-007-INTEGRATION: 6세대 메가 폼만 포함한다. 메가레쿠쟈는 스톤이 없다.
// 검증: Pokémon Showdown data/items.ts의 gen=6 대응을 정적 도감 인덱스와 대조했다.
// https://github.com/smogon/pokemon-showdown/blob/master/data/items.ts
export const GEN6_MEGA_STONES: Readonly<Record<string, string>> = Object.freeze({
  abomasnowmega: 'Abomasite',
  absolmega: 'Absolite',
  aerodactylmega: 'Aerodactylite',
  aggronmega: 'Aggronite',
  alakazammega: 'Alakazite',
  altariamega: 'Altarianite',
  ampharosmega: 'Ampharosite',
  audinomega: 'Audinite',
  banettemega: 'Banettite',
  beedrillmega: 'Beedrillite',
  blastoisemega: 'Blastoisinite',
  blazikenmega: 'Blazikenite',
  cameruptmega: 'Cameruptite',
  charizardmegax: 'Charizardite X',
  charizardmegay: 'Charizardite Y',
  dianciemega: 'Diancite',
  gallademega: 'Galladite',
  garchompmega: 'Garchompite',
  gardevoirmega: 'Gardevoirite',
  gengarmega: 'Gengarite',
  glaliemega: 'Glalitite',
  gyaradosmega: 'Gyaradosite',
  heracrossmega: 'Heracronite',
  houndoommega: 'Houndoominite',
  kangaskhanmega: 'Kangaskhanite',
  latiasmega: 'Latiasite',
  latiosmega: 'Latiosite',
  lopunnymega: 'Lopunnite',
  lucariomega: 'Lucarionite',
  manectricmega: 'Manectite',
  mawilemega: 'Mawilite',
  medichammega: 'Medichamite',
  metagrossmega: 'Metagrossite',
  mewtwomegax: 'Mewtwonite X',
  mewtwomegay: 'Mewtwonite Y',
  pidgeotmega: 'Pidgeotite',
  pinsirmega: 'Pinsirite',
  sableyemega: 'Sablenite',
  salamencemega: 'Salamencite',
  sceptilemega: 'Sceptilite',
  scizormega: 'Scizorite',
  sharpedomega: 'Sharpedonite',
  slowbromega: 'Slowbronite',
  steelixmega: 'Steelixite',
  swampertmega: 'Swampertite',
  tyranitarmega: 'Tyranitarite',
  venusaurmega: 'Venusaurite',
})

const stoneIds = new Set(Object.values(GEN6_MEGA_STONES).map(toShowdownId))

export function megaStoneFor(speciesName: string, formKey: FormKey): string | undefined {
  if (formKey === 'default') return undefined
  const key = toShowdownId(`${speciesName}-${formKey}`)
  return Object.hasOwn(GEN6_MEGA_STONES, key) ? GEN6_MEGA_STONES[key] : undefined
}

export function isGen6MegaStone(itemName: string): boolean {
  return stoneIds.has(toShowdownId(itemName))
}
