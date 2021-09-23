import { Artifact, reduceArtifacts } from "./artifact";
import { subElementRes } from "./dmg";

const elementTypes = ["geo"] as const;
type ElementType = typeof elementTypes[number];

type ElementRes = {
  [K in ElementType]: number;
};

interface EnemyStat {
  lv: number;
  elementRes: ElementRes;
}

interface CharacterStat {
  atk: number;
  def: number;
  hp: number;
  lv: number;
  critRate: number;
  critDmg: number;
}

interface StatBuffItem {
  amount: number;
}

interface DmgBuff {
  tag: string;
  amount: number;
}

interface StatBuff {
  atk: StatBuffItem[];
  atkPercentage: StatBuffItem[];
  def: StatBuffItem[];
  defPercentage: StatBuffItem[];
  hp: StatBuffItem[];
  hpPercentage: StatBuffItem[];
  critRate: StatBuffItem[];
  critDmg: StatBuffItem[];
  dmgBuff: DmgBuff[];
}

interface Character {
  baseStat: CharacterStat;
  statBuff: StatBuff;
}

const artifacts: Artifact[] = [
  {
    main: { amount: 4780, type: "hp" },
    sub: [
      { type: "critRate", amount: 0.062 },
      { type: "critDmg", amount: 0.194 },
      { type: "energyRecharge", amount: 0.097 },
      { type: "def", amount: 44 },
    ],
  },
  {
    main: { amount: 311, type: "atk" },
    sub: [
      { type: "critRate", amount: 0.097 },
      { type: "critDmg", amount: 0.187 },
      { type: "energyRecharge", amount: 0.065 },
      { type: "hp", amount: 0.099 },
    ],
  },
  {
    main: { amount: 0.583, type: "defPercentage" },
    sub: [
      { type: "critRate", amount: 0.101 },
      { type: "critDmg", amount: 0.155 },
      { type: "atk", amount: 33 },
      { type: "hp", amount: 0.053 },
    ],
  },
  {
    main: { amount: 0.466, type: "geoDmgBuff" },
    sub: [
      { type: "critRate", amount: 0.031 },
      { type: "critDmg", amount: 0.225 },
      { type: "energyRecharge", amount: 0.117 },
      { type: "hp", amount: 807 },
    ],
  },
  {
    main: { amount: 0.311, type: "critRate" },
    sub: [
      { type: "atkPercentage", amount: 0.117 },
      { type: "defPercentage", amount: 0.139 },
      { type: "def", amount: 19 },
      { type: "critDmg", amount: 0.187 },
    ],
  },
];

interface Attack {
  rate: number;
  dmgBuffTags: Set<string>;
}

const subAllElementRes = (a: ElementRes, b: ElementRes) => {
  const result = { ...a };
  elementTypes.forEach((k) => {
    result[k] = subElementRes(a[k], b[k]);
  });
  return result;
};

const noelleAtkBuff = (atk: number, def: number, buffPercentage: number) =>
  atk + def * buffPercentage;

const calc = (
  character: Character,
  enemyStat: EnemyStat,
  elementResDebuff: ElementRes,
  attack: Attack
) => {
  // 防御力計算
  const defPercentage =
    1 +
    character.statBuff.defPercentage.reduce(
      (prev, cur) => prev + cur.amount,
      0
    );
  const defFixed = character.statBuff.def.reduce(
    (prev, cur) => prev + cur.amount,
    0
  );
  const def = character.baseStat.def * defPercentage + defFixed;

  // 攻撃力計算

  const atkPercentage =
    1 +
    character.statBuff.atkPercentage.reduce(
      (prev, cur) => prev + cur.amount,
      0
    );
  const atkFixed = character.statBuff.atk.reduce(
    (prev, cur) => prev + cur.amount,
    0
  );

  const atk = noelleAtkBuff(
    character.baseStat.atk * atkPercentage + atkFixed,
    def,
    1.3
  );

  // ダメージバフ集計
  const dmgBuffPercentage =
    1 +
    character.statBuff.dmgBuff
      .filter((dmgBuff) => attack.dmgBuffTags.has(dmgBuff.tag))
      .reduce((prev, cur) => prev + cur.amount, 0);

  const lvDecay =
    (character.baseStat.lv + 100) /
    (enemyStat.lv + 100 + (character.baseStat.lv + 100));

  const debuffedElementRes = subAllElementRes(
    enemyStat.elementRes,
    elementResDebuff
  );

  const critRate =
    character.baseStat.critRate +
    character.statBuff.critRate.reduce((prev, cur) => prev + cur.amount, 0);

  const critDmg =
    1 +
    character.baseStat.critDmg +
    character.statBuff.critDmg.reduce((prev, cur) => prev + cur.amount, 0);

  // TODO: 元素耐性による減衰をなんとかする
  const resDecay = 1 - debuffedElementRes.geo;
  const nonCrit = atk * attack.rate * dmgBuffPercentage * lvDecay * resDecay;
  const crit = nonCrit * critDmg;

  return {
    nonCrit,
    crit,
    expected: critRate * crit + (1 - critRate) * nonCrit,
  };
};

const normalAttacks: Attack[] = [
  { rate: 1.56, dmgBuffTags: new Set(["geo", "normalAtk"]) },
  { rate: 1.45, dmgBuffTags: new Set(["geo", "normalAtk"]) },
  { rate: 1.71, dmgBuffTags: new Set(["geo", "normalAtk"]) },
  { rate: 2.24, dmgBuffTags: new Set(["geo", "normalAtk"]) },
];

console.log(`会心/非会心/期待値`);

// whiteblind
// atk,def: 12*4
// def: 51.7
// noelle uniq(def percentage): +0.3

const reducedArtifact = reduceArtifacts(artifacts);

const character = {
  baseStat: {
    lv: 90,
    def: 799,
    hp: 12071,
    // white blind: 510
    atk: 191 + 510,
    critDmg: 0.5,
    critRate: 0.05,
  },
  statBuff: {
    atk: [{ amount: reducedArtifact.atk }],
    atkPercentage: [
      // R5 whiteblind 4 stack
      { amount: 0.12 * 4 },
      { amount: reducedArtifact.atkPercentage },
    ],
    def: [{ amount: reducedArtifact.def }],
    defPercentage: [
      // noelle uniq stat
      { amount: 0.3 },

      // R5 whiteblind
      { amount: 0.517 },

      // R5 whiteblind 4 stack
      { amount: 0.12 * 4 },
      { amount: reducedArtifact.defPercentage },
    ],
    hp: [{ amount: reducedArtifact.hp }],
    hpPercentage: [{ amount: reducedArtifact.hpPercentage }],
    critRate: [{ amount: reducedArtifact.critRate }],
    critDmg: [{ amount: reducedArtifact.critDmg }],
    // 元素ダメージバフをどうにかする
    dmgBuff: [
      { amount: reducedArtifact.geoDmgBuff, tag: "geo" },
      // 逆飛び
      { tag: "normalAtk", amount: 0.4 },
      // 元素共鳴
      { tag: "normalAtk", amount: 0.15 },
      // 凝光
      { tag: "normalAtk", amount: 0.12 },
    ],
  },
};

const enemyStat = { lv: 90, elementRes: { geo: 0.1 } };
const elementResDebuff = { geo: 0.2 };

for (const atk of normalAttacks) {
  const { crit, nonCrit, expected } = calc(
    character,
    enemyStat,
    elementResDebuff,
    atk
  );
  console.log(`${crit} / ${nonCrit} / ${expected}`);
}
