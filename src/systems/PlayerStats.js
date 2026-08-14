export class PlayerStats {
  constructor(attributes = {}) {
    this.strength = attributes.strength ?? attributes.fuerza ?? 0;
    this.dexterity = attributes.dexterity ?? attributes.destreza ?? 0;
    this.constitution = attributes.constitution ?? attributes.constitucion ?? 0;
    this.wisdom = attributes.wisdom ?? attributes.intelligence ?? attributes.sabiduria ?? 0;
    this.agility = attributes.agility ?? attributes.agilidad ?? 0;

    // +1 protection formula
    this.maxHp = (this.constitution + 1) * 5;
    this.currentHp = this.maxHp;
  }

  isAllZero() {
    return (
      this.strength === 0 &&
      this.dexterity === 0 &&
      this.constitution === 0 &&
      this.wisdom === 0 &&
      this.agility === 0
    );
  }

  getPhysicalDamage() {
    return this.getPhysicalDamageResult().dmg;
  }

  getPhysicalDamageResult() {
    const base  = Math.floor((this.strength + 1) / 3);
    const d6    = Math.floor(Math.random() * 6) + 1;
    let   total = base + d6;
    const isCrit = Math.random() * 100 < this.getCritChance();
    if (isCrit) total = Math.floor(total * 1.5) + 1;
    return { dmg: Math.max(1, total), isCrit };
  }

  getMagicDamage() {
    return this.getMagicDamageResult().dmg;
  }

  getMagicDamageResult() {
    const base  = Math.floor((this.wisdom + 1) / 3);
    const d8    = Math.floor(Math.random() * 8) + 1;
    let   total = base + d8;
    const isCrit = Math.random() * 100 < this.getCritChance();
    if (isCrit) total = Math.floor(total * 1.5) + 1;
    return { dmg: Math.max(1, total), isCrit };
  }

  getEvasionChance() {
    return Math.min((this.agility + 1) * 3, 45);
  }

  getCritChance() {
    return Math.min((this.dexterity + 1) * 2, 35);
  }

  getInitiative() {
    const d6 = Math.floor(Math.random() * 6) + 1;
    return (this.agility + 1) + d6;
  }

  checkAttribute(attrName, threshold) {
    let val = 0;
    if (attrName === 'wisdom' || attrName === 'intelligence') val = this.wisdom;
    else val = this[attrName] ?? 0;

    const roll = (val + 1) * 3 + Math.floor(Math.random() * 6) + 1;
    return roll >= threshold;
  }

  heal(amount) {
    const old = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    return this.currentHp - old;
  }

  takeDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp === 0;
  }
}
