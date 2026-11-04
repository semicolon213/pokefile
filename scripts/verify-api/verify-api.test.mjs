// PokéAPI / data.pkmn.cc 계약 검증 테스트 (OQ-08, API_SPEC §5)
// 실행: node --test scripts/verify-api/verify-api.test.mjs
// 외부 네트워크를 실제로 호출한다. 의존성 없음(Node 18+ 내장 fetch, node:test).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const POKEAPI = 'https://pokeapi.co/api/v2';
const PKMN = 'https://data.pkmn.cc';
const MAX_ID = 721; // 6세대까지 (ADR-008)
const MEGA_VERSION_GROUPS = ['x-y', 'omega-ruby-alpha-sapphire']; // 6세대에 도입된 메가진화만
const SUPPORTED_VERSIONS = [
  'red', 'blue', 'yellow', 'gold', 'silver', 'crystal',
  'ruby', 'sapphire', 'emerald', 'firered', 'leafgreen',
  'diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver',
  'black', 'white', 'black-2', 'white-2',
  'x', 'y', 'omega-ruby', 'alpha-sapphire',
];

const getJson = async (url, init) => {
  const res = await fetch(url, init);
  assert.equal(res.status, 200, `${url} → ${res.status}`);
  return res.json();
};

const pool = async (items, size, fn) => {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
};

const toId = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const idFromUrl = (url) => Number(url.match(/\/(\d+)\/?$/)[1]);
const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
const koName = (names) => names.find((n) => n.language.name === 'ko')?.name;

// 여러 테스트에서 공유하는 전체 조회 결과
let speciesCache, pokemonCache, megaCache;
const allSpecies = () => (speciesCache ??= pool(ids, 12, (id) => getJson(`${POKEAPI}/pokemon-species/${id}`)));
const allPokemon = () => (pokemonCache ??= pool(ids, 12, (id) => getJson(`${POKEAPI}/pokemon/${id}`)));

// 6세대 메가진화: 이름에 -mega가 있고 pokemon-form.version_group이 x-y/oras인 것
const gen6Megas = () => (megaCache ??= (async () => {
  const list = await getJson(`${POKEAPI}/pokemon?limit=2000`);
  const candidates = list.results.filter((r) => /-mega(-|$)/.test(r.name));
  const forms = await pool(candidates, 12, (r) => getJson(`${POKEAPI}/pokemon-form/${r.name}`));
  const megas = forms.filter((f) => f.is_mega && MEGA_VERSION_GROUPS.includes(f.version_group.name));
  return { candidates, megas: await pool(megas, 12, (f) => getJson(`${POKEAPI}/pokemon/${f.pokemon.name}`)), forms };
})());

test('PokéAPI: 1~721 species의 세대가 generation-i~vi 범위', async () => {
  const species = await allSpecies();
  const gens = new Set(species.map((s) => s.generation.name));
  console.log('  generations:', [...gens].join(', '));
  assert.deepEqual([...gens].sort(), ['generation-i', 'generation-ii', 'generation-iii', 'generation-iv', 'generation-v', 'generation-vi']);
  assert.equal(species[MAX_ID - 1].name, 'volcanion');
});

test('PokéAPI: 한국어 이름 존재 여부', async () => {
  const species = await allSpecies();
  const missing = species.filter((s) => !koName(s.names));
  console.log(`  ko 이름 누락: ${missing.length}/${MAX_ID}`, missing.map((s) => s.name).slice(0, 20));
  assert.equal(koName(species[24].names), '피카츄');
});

test('PokéAPI: 한국어 도감 설명(FR-13)의 게임 버전 분포', async () => {
  const species = await allSpecies();
  const versions = new Map();
  const noneXY = [];
  for (const s of species) {
    const ko = s.flavor_text_entries.filter((f) => f.language.name === 'ko');
    if (!ko.some((f) => ['x', 'y', 'omega-ruby', 'alpha-sapphire'].includes(f.version.name))) noneXY.push(s.name);
    for (const f of ko) versions.set(f.version.name, (versions.get(f.version.name) ?? 0) + 1);
  }
  console.log('  ko 설명 버전:', Object.fromEntries(versions));
  console.log(`  6세대 게임(x/y/oras) ko 설명 없음: ${noneXY.length}/${MAX_ID}`, noneXY.slice(0, 20));
});

test('PokéAPI: 애니메이션 GIF 스프라이트 범위 (ADR-013)', async () => {
  const pokemon = await allPokemon();
  const { megas } = await gen6Megas();
  const report = (label, list) => {
    const bw = list.filter((p) => !p.sprites.versions['generation-v']['black-white'].animated.front_default);
    const sd = list.filter((p) => !p.sprites.other.showdown?.front_default);
    const sdShiny = list.filter((p) => !p.sprites.other.showdown?.front_shiny);
    console.log(`  [${label}] BW GIF 누락 ${bw.length}/${list.length}, showdown GIF 누락 ${sd.length}/${list.length}, showdown 이로치 누락 ${sdShiny.length}`);
    return { bw, sd };
  };
  const base = report('#1~#721', pokemon);
  report('#650~#721', pokemon.slice(649));
  const mega = report('6세대 메가', megas);
  console.log('  BW GIF 없는 메가:', mega.bw.map((p) => p.name).join(', '));
  assert.equal(base.sd.length, 0, 'showdown GIF는 전 범위 존재해야 함');
  for (const url of [pokemon[24].sprites.other.showdown.front_default, megas[0].sprites.other.showdown.front_default]) {
    const res = await fetch(url, { method: 'HEAD' });
    console.log('  ', url, res.status, res.headers.get('content-type'));
    assert.equal(res.status, 200);
  }
});

test('PokéAPI: 타입 변경 이력(past_types) — 6세대 기준', async () => {
  const pokemon = await allPokemon();
  const withPast = pokemon.filter((p) => p.past_types?.length);
  const rows = withPast.map((p) => `${p.name}(${p.past_types.map((pt) => pt.generation.name).join('/')})`);
  console.log(`  past_types 있는 포켓몬 ${withPast.length}:`, rows.join(', '));
  // generation-vi 이후 타입이 바뀐 경우가 있으면 6세대 기준 표시를 별도로 고려해야 한다
  const changedAfterGen6 = withPast.filter((p) => p.past_types.some((pt) => !['generation-i', 'generation-ii', 'generation-iii', 'generation-iv', 'generation-v'].includes(pt.generation.name)));
  console.log('  6세대 이후 타입 변경:', changedAfterGen6.map((p) => p.name));
});

test('PokéAPI: 6세대 메가진화 목록과 한국어 폼 이름', async () => {
  const { candidates, megas, forms } = await gen6Megas();
  const excluded = forms.filter((f) => !megas.some((m) => m.name === f.pokemon.name)).map((f) => `${f.name}(${f.version_group.name})`);
  console.log(`  -mega 후보 ${candidates.length}개 중 6세대 메가 ${megas.length}개`);
  console.log('  포함:', megas.map((m) => `${m.name}#${m.id}`).join(', '));
  console.log('  제외(7세대 이후 도입):', excluded.join(', '));
  const koMissing = forms.filter((f) => megas.some((m) => m.name === f.pokemon.name) && !koName(f.form_names));
  console.log('  ko 폼 이름 누락:', koMissing.map((f) => f.name));
  const venusaur = forms.find((f) => f.name === 'venusaur-mega');
  assert.equal(koName(venusaur.form_names), '메가이상해꽃');
  assert.ok(megas.every((m) => idFromUrl(m.species.url) <= MAX_ID));
  const prim = await getJson(`${POKEAPI}/pokemon-form/kyogre-primal`);
  console.log('  참고: 원시회귀 kyogre-primal is_mega =', prim.is_mega, '| version_group =', prim.version_group.name);
});

test('PokéAPI: 출현 장소 버전 범위 (6세대 게임까지)', async () => {
  for (const id of [25, 495, 650, 714]) {
    const enc = await getJson(`${POKEAPI}/pokemon/${id}/encounters`);
    const versions = new Set(enc.flatMap((e) => e.version_details.map((v) => v.version.name)));
    const inside = [...versions].filter((v) => SUPPORTED_VERSIONS.includes(v));
    const outside = [...versions].filter((v) => !SUPPORTED_VERSIONS.includes(v));
    console.log(`  #${id}: 장소 ${enc.length}개 | 지원 버전 [${inside.join(', ')}] | 범위 밖 [${outside.join(', ')}]`);
  }
  const kalos = await getJson(`${POKEAPI}/location/600`);
  const kanto = await getJson(`${POKEAPI}/location/100`);
  console.log('  location ko 이름 — 칼로스:', koName(kalos.names) ?? '(없음)', '| 관동:', koName(kanto.names) ?? '(없음)');
});

test('PokéAPI: 진화 체인 분기와 6세대 이후 진화 포함 여부 (FR-15)', async () => {
  const eevee = await getJson(`${POKEAPI}/evolution-chain/67`);
  const evolved = eevee.chain.evolves_to.map((e) => [e.species.name, idFromUrl(e.species.url)]);
  console.log('  이브이 분기:', evolved);
  assert.ok(evolved.some(([n]) => n === 'sylveon'), '님피아(#700)는 범위 안');
  // 7세대 이후 진화형이 섞이는 예: 메리프 계열 등은 아니지만, 범위 밖 진화형 존재 여부를 전수 확인
  const species = await allSpecies();
  const chainIds = [...new Set(species.map((s) => idFromUrl(s.evolution_chain.url)))];
  const chains = await pool(chainIds, 12, (id) => getJson(`${POKEAPI}/evolution-chain/${id}`));
  const outside = [];
  const walk = (node) => { const id = idFromUrl(node.species.url); if (id > MAX_ID) outside.push(`${node.species.name}#${id}`); node.evolves_to.forEach(walk); };
  chains.forEach((c) => walk(c.chain));
  console.log(`  진화 체인 ${chains.length}개 중 #${MAX_ID + 1} 이후 종 ${outside.length}개:`, outside.join(', '));
});

test('data.pkmn.cc: CORS 및 리다이렉트', async () => {
  const res = await fetch(`${PKMN}/sets/gen6.json`, { headers: { Origin: 'https://example.github.io' } });
  assert.equal(res.status, 200);
  console.log('  최종 URL:', res.url);
  console.log('  access-control-allow-origin:', res.headers.get('access-control-allow-origin'));
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('data.pkmn.cc: gen6 세팅 스키마와 PokéAPI 이름 매핑 (FR-17, DR-04)', async () => {
  const sets = await getJson(`${PKMN}/sets/gen6.json`);
  const keys = Object.keys(sets);
  const formats = new Set(keys.flatMap((k) => Object.keys(sets[k])));
  console.log(`  세팅 보유 키: ${keys.length}, 포맷:`, [...formats].join(', '));

  const fields = new Set();
  for (const k of keys) for (const f of Object.values(sets[k])) for (const s of Object.values(f)) Object.keys(s).forEach((x) => fields.add(x));
  console.log('  세팅 필드:', [...fields].join(', '));

  // 기본 폼: toId(species.name) === toId(세팅 키)
  const species = await allSpecies();
  const byId = new Map(keys.map((k) => [toId(k), k]));
  const unmatched = species.filter((s) => !byId.has(toId(s.name)));
  console.log(`  species→세팅 매칭: ${MAX_ID - unmatched.length}/${MAX_ID}, 세팅 없음: ${unmatched.length}`);

  // 메가: PokéAPI `charizard-mega-x` ↔ Showdown `Charizard-Mega-X` (toId 동일)
  const { megas } = await gen6Megas();
  const megaUnmatched = megas.filter((m) => !byId.has(toId(m.name)));
  console.log(`  6세대 메가→세팅 매칭: ${megas.length - megaUnmatched.length}/${megas.length}, 불일치/세팅 없음:`, megaUnmatched.map((m) => m.name).join(', '));

  const known = new Set([...species.map((s) => toId(s.name)), ...megas.map((m) => toId(m.name))]);
  const orphan = keys.filter((k) => !known.has(toId(k)));
  console.log(`  매핑 대상이 아닌 세팅 키 ${orphan.length}개:`, orphan.join(', '));

  const pokemonList = await getJson(`${POKEAPI}/pokemon?limit=${MAX_ID}`);
  const suffixed = pokemonList.results.filter((p, i) => p.name !== species[i].name).map((p) => p.name);
  console.log('  pokemon 기본 폼 이름 ≠ species 이름:', suffixed.join(', '));
});

// 변칙 룰 포맷: 실제 게임과 다른 특성·기술 조합이라 실전 세팅으로 표시하지 않는다
const NON_STANDARD_FORMATS = new Set(['balancedhackmons', 'purehackmons', 'almostanyability', 'stabmons', 'cap']);

test('data.pkmn.cc: 실전 세팅 추출 — 기본 폼과 메가(메가스톤) (FR-17)', async () => {
  const sets = await getJson(`${PKMN}/sets/gen6.json`);
  const entry = (name) => sets[Object.keys(sets).find((k) => toId(k) === toId(name))];
  const items = (s) => [].concat(s.item ?? []);

  // 기본 폼: 한카리아스 ou 세팅이 표시 항목(성격·노력치·도구·기술)을 갖는지
  const chomp = Object.values(entry('garchomp').ou);
  console.log('  garchomp ou 세팅', chomp.length, '개, 예:', JSON.stringify(chomp[0]));
  assert.ok(chomp.every((s) => s.moves?.length && s.nature && s.evs));
  assert.equal(entry('caterpie'), undefined, '세팅 없는 포켓몬은 empty');

  // 메가: 메가 키 세팅(일반 포맷) + 기본 종 세팅 중 메가스톤을 지닌 세팅(일반 포맷)
  const { megas } = await gen6Megas();
  const stoneOf = (megaName) => {
    const base = megaName.replace(/-mega(-[xy])?$/, '');
    const suffix = megaName.match(/-mega-([xy])$/)?.[1]?.toUpperCase();
    const held = new Set(Object.values(entry(base) ?? {}).flatMap((f) => Object.values(f).flatMap(items)));
    return [...held].find((i) => /ite( [XY])?$/.test(i) && i !== 'Eviolite' && (!suffix || i.endsWith(` ${suffix}`)));
  };
  const rows = megas.map((m) => {
    const base = m.name.replace(/-mega(-[xy])?$/, '');
    const stone = stoneOf(m.name);
    const viaStone = Object.entries(entry(base) ?? {})
      .filter(([f]) => !NON_STANDARD_FORMATS.has(f))
      .flatMap(([, f]) => Object.values(f).filter((s) => stone && items(s).includes(stone)));
    const viaKey = Object.entries(entry(m.name) ?? {}).filter(([f]) => !NON_STANDARD_FORMATS.has(f)).flatMap(([, f]) => Object.values(f));
    return { name: m.name, stone, count: viaStone.length + viaKey.length, viaKeyOnlyNonStandard: !!entry(m.name) && !viaKey.length };
  });
  const none = rows.filter((r) => !r.count);
  console.log(`  일반 포맷 실전 세팅이 있는 6세대 메가: ${megas.length - none.length}/${megas.length}`);
  console.log('  세팅 없음:', none.map((r) => `${r.name}(스톤 ${r.stone ?? '없음'})`).join(', '));
  console.log('  메가 키 세팅이 변칙 룰 포맷뿐인 메가:', rows.filter((r) => r.viaKeyOnlyNonStandard).length);
  const cx = rows.find((r) => r.name === 'charizard-mega-x');
  assert.equal(cx.stone, 'Charizardite X');
  assert.ok(cx.count > 0);
});
