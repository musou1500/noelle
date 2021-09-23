// お試し珊瑚宮心海(lv80)
// 武器: 不滅の月華 lv80
// HP:30711
// 天賦lv: すべて8
// 攻撃力:1271
// ダメージバフ:83.2+15
// 与える治療効果:70.9
// 通常攻撃1段目:1399
// 通常攻撃1段目(元素爆発中):6053
// 敵: lv80ヒルチャール

const lvDecayRate = (lv: number, enemyLv: number) =>
  (lv + 100) / (enemyLv + 100 + (lv + 100));

const resDecayRate = (elementRes: number, sub: number) => {
  if (elementRes > sub) {
    return 1 - (elementRes - sub);
  } else {
    return 1 - (sub - elementRes) / 2;
  }
};

export const calc = (ultEnabled = false) => {
  const ability = 1.094;
  const atk = 1271;
  const hp = 30711;
  const giveHeelBuff = 0.709;
  const dmgBuff = 1.832;
  const weaponDmgUp = hp * 0.01;
  let baseDmg = atk * ability + weaponDmgUp;
  if (ultEnabled) {
    const passiveUpRate = giveHeelBuff * 0.15;
    baseDmg += hp * (0.077 + passiveUpRate);
  }

  const lvDecay = lvDecayRate(80, 80);
  const resDecay = resDecayRate(0.1, 0);
  return [baseDmg * dmgBuff * lvDecay * resDecay];
};

console.log("ult disabled", calc());
console.log("ult enabled", calc(true));
