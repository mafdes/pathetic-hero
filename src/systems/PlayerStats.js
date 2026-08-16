export class PlayerStats {
  constructor(attributes = {}) {
    this.strength = attributes.strength ?? attributes.fuerza ?? 0;
    this.dexterity = attributes.dexterity ?? attributes.destreza ?? 0;
    this.constitution = attributes.constitution ?? attributes.constitucion ?? 0;
    this.wisdom = attributes.wisdom ?? attributes.intelligence ?? attributes.sabiduria ?? 0;
    this.agility = attributes.agility ?? attributes.agilidad ?? 0;

    // Fórmulas de Vitalidad (PV) y Maná (PM)
    this.maxHp = (this.constitution + 1) * 5;
    this.currentHp = this.maxHp;

    this.maxMp = (this.wisdom + 1) * 4;
    this.currentMp = this.maxMp;

    // Sistema de Experiencia (EXP) y Nivel
    this.level = 1;
    this.currentExp = 0;
    this.nextLevelExp = 15; // ¡Nivel 2 se alcanza con 15 EXP (1er Goblin)!
    this.attributePoints = 0;
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

  getNextLevelThreshold(lvl) {
    if (lvl === 1) return 15;
    if (lvl === 2) return 40;
    if (lvl === 3) return 80;
    return lvl * 60 - 40;
  }

  addExp(amount) {
    this.currentExp += amount;
    let leveledUp = false;
    let levelsGained = 0;

    while (this.currentExp >= this.nextLevelExp) {
      this.currentExp -= this.nextLevelExp;
      this.level += 1;
      this.attributePoints += 1; // +1 Punto de Atributo por Nivel
      levelsGained += 1;
      leveledUp = true;
      this.nextLevelExp = this.getNextLevelThreshold(this.level);
    }

    return { leveledUp, levelsGained, newLevel: this.level };
  }

  allocateAttribute(attrName) {
    if (this.attributePoints <= 0) return false;

    if (attrName === 'constitution' || attrName === 'constitucion') {
      this.constitution += 1;
      this.maxHp += 5;
      this.currentHp += 5; // Aumento proporcional instantáneo de vida actual
    } else if (attrName === 'wisdom' || attrName === 'sabiduria') {
      this.wisdom += 1;
      this.maxMp += 4;
      this.currentMp += 4; // Aumento proporcional instantáneo de maná actual
    } else if (attrName === 'strength' || attrName === 'fuerza') {
      this.strength += 1;
    } else if (attrName === 'dexterity' || attrName === 'destreza') {
      this.dexterity += 1;
    } else if (attrName === 'agility' || attrName === 'agilidad') {
      this.agility += 1;
    } else {
      return false;
    }

    this.attributePoints -= 1;
    return true;
  }

  fullRestore() {
    this.currentHp = this.maxHp;
    this.currentMp = this.maxMp;
  }

  getPhysicalDamage() {
    return this.getPhysicalDamageResult().dmg;
  }

  getPhysicalDamageResult() {
    const base = this.strength + 2;
    const d6 = Math.floor(Math.random() * 6) + 1;
    let total = base + d6;
    const isCrit = Math.random() * 100 < this.getCritChance();
    if (isCrit) total = Math.floor(total * 1.5) + 1;
    return { dmg: Math.max(1, total), isCrit, type: 'physical' };
  }

  getSpellDamageResult(spellId) {
    let base = this.wisdom + 2;
    let die = 6;
    let bonus = 0;
    let type = 'arcane';
    let costMp = 2;

    if (spellId === 'fireball') {
      base = this.wisdom + 3;
      die = 10;
      type = 'fire';
      costMp = 4;
    } else if (spellId === 'icebeam') {
      base = this.wisdom + 3;
      die = 8;
      type = 'ice';
      costMp = 4;
    } else if (spellId === 'lightning') {
      base = this.wisdom + 4;
      die = 12;
      bonus = 4;
      type = 'lightning';
      costMp = 7;
    } else if (spellId === 'arcane') {
      base = this.wisdom + 2;
      die = 6;
      type = 'arcane';
      costMp = 2;
    }

    const roll = Math.floor(Math.random() * die) + 1;
    let total = base + roll + bonus;
    const isCrit = Math.random() * 100 < this.getCritChance();
    if (isCrit) total = Math.floor(total * 1.5) + 1;

    return { dmg: Math.max(1, total), isCrit, type, costMp };
  }

  getMagicDamage() {
    return this.getMagicDamageResult().dmg;
  }

  getMagicDamageResult() {
    return this.getSpellDamageResult('arcane');
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

  useMp(amount) {
    if (this.currentMp >= amount) {
      this.currentMp -= amount;
      return true;
    }
    return false;
  }

  restoreMp(amount) {
    const old = this.currentMp;
    this.currentMp = Math.min(this.maxMp, this.currentMp + amount);
    return this.currentMp - old;
  }

  takeDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp === 0;
  }

  toJSON() {
    return {
      level: this.level,
      currentExp: this.currentExp,
      nextLevelExp: this.nextLevelExp,
      attributePoints: this.attributePoints,
      strength: this.strength,
      dexterity: this.dexterity,
      constitution: this.constitution,
      wisdom: this.wisdom,
      agility: this.agility,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      currentMp: this.currentMp,
      maxMp: this.maxMp,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.level = data.level ?? 1;
    this.currentExp = data.currentExp ?? 0;
    this.nextLevelExp = data.nextLevelExp ?? 15;
    this.attributePoints = data.attributePoints ?? 0;
    this.strength = data.strength ?? this.strength;
    this.dexterity = data.dexterity ?? this.dexterity;
    this.constitution = data.constitution ?? this.constitution;
    this.wisdom = data.wisdom ?? this.wisdom;
    this.agility = data.agility ?? this.agility;

    this.maxHp = (this.constitution + 1) * 5;
    this.currentHp = Math.min(this.maxHp, data.currentHp ?? this.maxHp);

    this.maxMp = (this.wisdom + 1) * 4;
    this.currentMp = Math.min(this.maxMp, data.currentMp ?? this.maxMp);
  }
}
