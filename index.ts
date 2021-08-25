const artifactOptTypes = [
  "hp",
  "hpPercentage",
  "atk",
  "atkPercentage",
  "def",
  "defPercentage",
  "geoDmgBuff",
  "critRate",
  "critDmg",
  "energyRecharge",
] as const;

type ArtifactOptType = typeof artifactOptTypes[number];
const elementTypes = ["geo"] as const;
type ElementType = typeof elementTypes[number];

type ElementRes = {
  [K in ElementType]: number;
};

interface ArtifactOpt {
  amount: number;
  type: ArtifactOptType;
}

interface EnemyStat {
  lv: number;
  elementRes: ElementRes;
}

interface Artifact {
  main: ArtifactOpt;
  sub: ArtifactOpt[];
}

interface CharBasicStat {
  atk: number;
  def: number;
  hp: number;
  lv: number;
  critRate: number;
  critDmg: number;
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

type ReducedArtifact = { [K in ArtifactOptType]: number };

const reduceArtifacts = (artifacts: Artifact[]): ReducedArtifact => {
  const result: ReducedArtifact = {
    hp: 0,
    hpPercentage: 0,
    atk: 0,
    atkPercentage: 0,
    def: 0,
    defPercentage: 0,
    geoDmgBuff: 0,
    critRate: 0,
    critDmg: 0,
    energyRecharge: 0,
  };

  for (const artifact of artifacts) {
    result[artifact.main.type] += artifact.main.amount;
    for (const subOpt of artifact.sub) {
      result[subOpt.type] += subOpt.amount;
    }
  }

  return result;
};

interface Attack {
  rate: number;
}

interface DmgBuffs {
  normalAtk: number;
}

const subElementRes = (a: ElementRes, b: ElementRes) => {
  const result = { ...a };
  elementTypes.forEach((k) => {
    const aAmount = a[k];
    const bAmount = b[k];
    if (aAmount < bAmount) {
      result[k] = -(bAmount - aAmount) / 2;
    } else {
      result[k] = aAmount - bAmount;
    }
  });

  return result;
};

const noelleAtkBuff = (atk: number, def: number, buffPercentage: number) =>
  atk + def * buffPercentage;

const calc = (
  basicStat: CharBasicStat,
  enemyStat: EnemyStat,
  artifacts: Artifact[],
  dmgBuffs: DmgBuffs,
  elementResDebuff: ElementRes,
  attack: Attack
) => {
  const reducedArtifact = reduceArtifacts(artifacts);

  // whiteblind
  // atk,def: 12*4
  // def: 51.7
  const def =
    basicStat.def * (1 + reducedArtifact.defPercentage + 0.48 + 0.517 + 0.3) +
    reducedArtifact.def;
  const atk = noelleAtkBuff(
    basicStat.atk * (1 + reducedArtifact.atkPercentage + 0.48) +
      reducedArtifact.atk,
    def,
    // 実測するとなぜか防御力5.5%分くらい多めに伸びてる．．．．
    // 天賦12時点で1.355456976866329
    1.35
  );

  const dmgBuff = 1 + reducedArtifact.geoDmgBuff + dmgBuffs.normalAtk;
  const lvDecay =
    (basicStat.lv + 100) / (enemyStat.lv + 100 + (basicStat.lv + 100));
  const debuffedElementRes = subElementRes(
    enemyStat.elementRes,
    elementResDebuff
  );

  const resDecay = 1 - debuffedElementRes.geo;
  const nonCrit = atk * attack.rate * dmgBuff * lvDecay * resDecay;
  const crit = nonCrit * (1 + reducedArtifact.critDmg + basicStat.critDmg);

  return {
    nonCrit,
    crit,
    expected:
      (reducedArtifact.critRate + basicStat.critRate) * crit +
      (1 - reducedArtifact.critRate + basicStat.critRate) * nonCrit,
  };
};

const normalAttacks: Attack[] = [
  { rate: 1.56 },
  { rate: 1.45 },
  { rate: 1.71 },
  { rate: 2.24 },
];

console.log(`会心/非会心/期待値`);

let sumExpected = 0;
for (const attack of normalAttacks) {
  const result = calc(
    {
      lv: 90,
      def: 799,
      hp: 12071,
      atk: 191 + 510,
      critDmg: 0.5,
      critRate: 0.05,
    },
    { lv: 90, elementRes: { geo: 0.1 } },
    artifacts,
    // 逆飛び + 元素共鳴 + 凝光バフ
    { normalAtk: 0.4 + 0.15 + 0.12 },
    { geo: 0.2 },
    attack
  );

  sumExpected += result.expected;
  console.log(
    `${Math.floor(result.crit)}/${Math.floor(result.nonCrit)}/${Math.floor(
      result.expected
    )}`
  );
}

console.log(`期待値: ${sumExpected}`);
