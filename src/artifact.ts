export const artifactOptTypes = [
  "hp",
  "hpPercentage",
  "atk",
  "atkPercentage",
  "def",
  "defPercentage",
  "critRate",
  "critDmg",
  "energyRecharge",

  // 元素ダメージバフ
  "geoDmgBuff",
  "cryoDmgBuff",
  "pyroDmgBuff",
  "anemoDmgBuff",
  "hydroDmgBuff",
  "electroDmgBuff",
] as const;

export type ArtifactOptType = typeof artifactOptTypes[number];

export interface ArtifactOpt {
  amount: number;
  type: ArtifactOptType;
}

export interface Artifact {
  main: ArtifactOpt;
  sub: ArtifactOpt[];
}

export type ReducedArtifact = { [K in ArtifactOptType]: number };

export const reduceArtifacts = (artifacts: Artifact[]): ReducedArtifact => {
  const result: ReducedArtifact = {
    hp: 0,
    hpPercentage: 0,
    atk: 0,
    atkPercentage: 0,
    def: 0,
    defPercentage: 0,
    critRate: 0,
    critDmg: 0,
    energyRecharge: 0,
    geoDmgBuff: 0,
    cryoDmgBuff: 0,
    pyroDmgBuff: 0,
    anemoDmgBuff: 0,
    hydroDmgBuff: 0,
    electroDmgBuff: 0,
  };

  for (const artifact of artifacts) {
    result[artifact.main.type] += artifact.main.amount;
    for (const subOpt of artifact.sub) {
      result[subOpt.type] += subOpt.amount;
    }
  }

  return result;
};
