export const calcLvDecay = (lv: number, enemyLv: number) =>
  (lv + 100) / (enemyLv + 100 + (lv + 100));

export const subElementRes = (elementRes: number, sub: number) => {
  if (elementRes > sub) {
    return 1 - (elementRes - sub);
  } else {
    return 1 - (elementRes - sub) / 2;
  }
};
