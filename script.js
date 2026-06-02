const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const livesText = document.getElementById("livesText");
const moneyText = document.getElementById("moneyText");
const waveText = document.getElementById("waveText");
const scoreText = document.getElementById("scoreText");
const waveNameText = document.getElementById("waveNameText");
const wavePreviewText = document.getElementById("wavePreviewText");
const wavePreviewList = document.getElementById("wavePreviewList");
const messageText = document.getElementById("messageText");
const startWaveBtn = document.getElementById("startWaveBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speedBtn = document.getElementById("speedBtn");
const restartBtn = document.getElementById("restartBtn");
const bossPanel = document.getElementById("bossPanel");
const bossNameText = document.getElementById("bossNameText");
const bossHpText = document.getElementById("bossHpText");
const bossBarFill = document.getElementById("bossBarFill");
const achievementDropdownBtn = document.getElementById("achievementDropdownBtn");
const achievementList = document.getElementById("achievementList");
const achievementToast = document.getElementById("achievementToast");
const towerDropdownBtn = document.getElementById("towerDropdownBtn");
const towerSelect = document.getElementById("towerSelect");
const selectedTowerBox = document.getElementById("selectedTowerBox");
const selectedPlacedTowerBox = document.getElementById("selectedPlacedTowerBox");
const targetModeBtn = document.getElementById("targetModeBtn");
const sellTowerBtn = document.getElementById("sellTowerBtn");
const abilityList = document.getElementById("abilityList");

const upgradeDamageBtn = document.getElementById("upgradeDamageBtn");
const upgradeRangeBtn = document.getElementById("upgradeRangeBtn");
const upgradeSpeedBtn = document.getElementById("upgradeSpeedBtn");

const startOverlay = document.getElementById("startOverlay");
const playerNameInput = document.getElementById("playerNameInput");
const startGameBtn = document.getElementById("startGameBtn");

const scoreboardOverlay = document.getElementById("scoreboardOverlay");
const finalScoreText = document.getElementById("finalScoreText");
const finalWaveText = document.getElementById("finalWaveText");
const scoreboardList = document.getElementById("scoreboardList");
const playAgainBtn = document.getElementById("playAgainBtn");

const targetModes = ["first", "strong", "close", "last"];
const targetModeLabels = {
  first: "First",
  strong: "Strong",
  close: "Close",
  last: "Last"
};

let lives = GAME_CONFIG.startingLives;
let money = GAME_CONFIG.startingMoney;
let wave = 1;
let score = 0;
const unlockedTowerTypes = new Set(
  Object.entries(GAME_CONFIG.towers)
    .filter(([, tower]) => !tower.unlockCost)
    .map(([key]) => key)
);

let enemies = [];
let towers = [];
let bullets = [];
let effects = [];
let spawnQueue = [];

let playerName = localStorage.getItem("playerName") || "";
let gameStarted = false;
let scoreSubmitted = false;

let selectedTowerType = null;
let selectedPlacedTower = null;
let hoveredTower = null;
let abilityHoverTower = null;
let pendingPlacement = null;
let waveRunning = false;
let spawnTimer = 0;
let gameOver = false;
let victory = false;
let paused = false;
let speedMultiplier = 1;
let mouse = { x: 0, y: 0, inside: false };
let abilityListFrame = 0;

const achievementDefinitions = [
  { id: "wave10", label: "Overlev wave 10", check: () => wave > 10 || victory },
  { id: "firstBoss", label: "Drep første Simonsen", check: () => bossKills > 0 },
  { id: "unlockBergh", label: "Lås opp hemmelig tårn", check: () => unlockedTowerTypes.has("bergh") },
  { id: "noLivesLost20", label: "Wave 20 uten tapte liv", check: () => wave > 20 && lives === GAME_CONFIG.startingLives },
  { id: "victory", label: "Fullfør alle 100 waves", check: () => victory }
];
const unlockedAchievements = new Set();
let bossKills = 0;
let achievementToastTimer = null;

const images = {};
const mapImage = new Image();
mapImage.src = GAME_CONFIG.map.image;

const pathSegments = GAME_CONFIG.map.path.slice(0, -1).map((point, index) => {
  const next = GAME_CONFIG.map.path[index + 1];
  return {
    a: point,
    b: next,
    length: Math.hypot(next.x - point.x, next.y - point.y)
  };
});
const totalPathLength = pathSegments.reduce((total, segment) => total + segment.length, 0);

function loadImage(key, src) {
  const img = new Image();
  img.src = src;
  images[key] = img;
}

Object.entries(GAME_CONFIG.towers).forEach(([key, tower]) => loadImage(`tower-${key}`, tower.icon));
Object.entries(GAME_CONFIG.enemies).forEach(([key, enemy]) => loadImage(`enemy-${key}`, enemy.icon));
Object.entries(GAME_CONFIG.towers).forEach(([key, tower]) => {
  if (tower.projectileIcon) loadImage(`projectile-${key}`, tower.projectileIcon);
  if (tower.ability?.icon) loadImage(`ability-${key}`, tower.ability.icon);
  if (tower.ability?.effectIcon) loadImage(`ability-effect-${key}`, tower.ability.effectIcon);
  if (tower.effectIcon) loadImage(`effect-${key}`, tower.effectIcon);
});

function getWaveConfig() {
  return GAME_CONFIG.waves[(wave - 1) % GAME_CONFIG.waves.length];
}

function getWaveScale() {
  return 1 + Math.floor((wave - 1) / GAME_CONFIG.waves.length) * 0.55 + (wave - 1) * 0.075;
}

function getWaveEnemyCount(waveConfig = getWaveConfig()) {
  return waveConfig.groups.reduce((total, group) => total + group.count, 0);
}

function getEnemyDisplayName(type) {
  return GAME_CONFIG.enemies[type]?.name || type;
}

function showMessage(text) {
  messageText.textContent = text;
}

function showAchievementPopup(label) {
  achievementToast.textContent = `Achievement unlocked: ${label}`;
  achievementToast.classList.remove("hidden");

  if (achievementToastTimer) {
    clearTimeout(achievementToastTimer);
  }

  achievementToastTimer = setTimeout(() => {
    achievementToast.classList.add("hidden");
  }, 2600);
}

function formatMoney(value) {
  return `${Math.round(value)} kr`;
}

function isTowerUnlocked(type) {
  return unlockedTowerTypes.has(type);
}

function getTowerPlacementCount(type) {
  return towers.filter(tower => tower.type === type).length;
}

function getTowerPlacementLimit(type) {
  const limit = GAME_CONFIG.towers[type]?.maxPlaced;
  return Number.isFinite(limit) && limit >= 0 ? limit : Infinity;
}

function isTowerLimitReached(type) {
  return getTowerPlacementCount(type) >= getTowerPlacementLimit(type);
}

function getTowerLimitText(type) {
  const count = getTowerPlacementCount(type);
  const limit = getTowerPlacementLimit(type);
  return limit === Infinity ? `${count}/∞ plassert` : `${count}/${limit} plassert`;
}

function getEnemyHpMultiplier() {
  if (wave <= 40) return 1;

  const wavesAfter40 = wave - 40;

  return 1 + wavesAfter40 * 0.05;
}
class Enemy {
  constructor(type, options = {}) {
    const stats = GAME_CONFIG.enemies[type];
    const scale = options.scale || getWaveScale();
    const hpMultiplier = getEnemyHpMultiplier();

    
    this.type = type;
    this.stats = stats;
    this.x = options.x ?? GAME_CONFIG.map.path[0].x;
    this.y = options.y ?? GAME_CONFIG.map.path[0].y;
    this.rotation = 0;
    this.pathIndex = options.pathIndex ?? 0;
    this.distanceTravelled = options.distanceTravelled ?? 0;

    this.maxHp = Math.round((stats.hp + wave * 7) * scale * hpMultiplier);
    this.hp = options.hp ?? this.maxHp;
    this.baseSpeed = stats.speed + Math.min(wave * 0.018, 0.42);
    this.speed = this.baseSpeed;
    this.reward = Math.round(stats.reward * (1 + wave * 0.025));
    this.damage = stats.damage;
    this.size = stats.size;
    this.color = stats.color;
    this.armor = stats.armor || 0;
    this.regen = stats.regen || 0;
    this.alive = true;
    this.reachedEnd = false;
    this.slowTimer = 0;
    this.slowMultiplier = 1;
  }

  update() {
    if (this.regen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen);
    }

    if (this.slowTimer > 0) {
      this.slowTimer--;
      this.speed = this.baseSpeed * this.slowMultiplier;
    } else {
      this.speed = this.baseSpeed;
      this.slowMultiplier = 1;
    }

    const target = GAME_CONFIG.map.path[this.pathIndex + 1];
    if (!target) {
      this.reachBase();
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.rotation = Math.atan2(dy, dx) + Math.PI / 2;

    if (distance <= this.speed) {
      this.distanceTravelled += distance;
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
      this.distanceTravelled += this.speed;
    }
  }

  reachBase() {
    this.alive = false;
    this.reachedEnd = true;
    lives = Math.max(0, lives - this.damage);
    effects.push(new FloatingText(`-${this.damage}`, this.x, this.y, "#f87171"));
    if (lives <= 0) {
      gameOver = true;
      paused = false;
      handleGameOverScoreboard();
    }
    updateUI();
  }

  split() {
    if (!this.stats.children || this.reachedEnd) return;

    for (let i = 0; i < this.stats.children.count; i++) {
      const spacing = this.stats.childSpacing || 42;
      const childDistance = Math.max(0, this.distanceTravelled - i * spacing);
      const point = getPointAtPathDistance(childDistance);
      const sideOffset = ((i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2)) * 8;
      enemies.push(new Enemy(this.stats.children.type, {
        x: point.x + sideOffset,
        y: point.y + sideOffset,
        pathIndex: getPathIndexAtPathDistance(childDistance),
        distanceTravelled: childDistance,
        scale: Math.max(0.55, getWaveScale() * 0.72)
      }));
    }
  }

  draw() {
    const img = images[`enemy-${this.type}`];

    ctx.save();
    ctx.shadowColor = this.slowTimer > 0 ? "rgba(103, 232, 249, 0.8)" : "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = this.slowTimer > 0 ? 16 : 6;

    if (img && img.complete) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.drawImage(img, -this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color || "#ef4444";
      ctx.fill();
    }
    ctx.restore();

    if (this.armor > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2 + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(226, 232, 240, 0.72)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const hpWidth = Math.max(42, this.size + 10);
    const hpX = this.x - hpWidth / 2;
    const hpY = this.y - this.size / 2 - 14;
    ctx.fillStyle = "#020617";
    ctx.fillRect(hpX, hpY, hpWidth, 6);

    ctx.fillStyle = this.regen > 0 ? "#4ade80" : this.slowTimer > 0 ? "#67e8f9" : "#facc15";
    ctx.fillRect(hpX, hpY, hpWidth * Math.max(0, this.hp / this.maxHp), 6);
  }
}

function getTowerUpgradeConfig(towerType, kind) {
  const towerUpgrade = GAME_CONFIG.towers[towerType]?.upgrades?.[kind];
  const globalUpgrade = GAME_CONFIG.upgrades[kind];

  return towerUpgrade || globalUpgrade;
}

class Tower {
  constructor(x, y, type) {
    const stats = GAME_CONFIG.towers[type];

    this.x = x;
    this.y = y;
    this.type = type;
    this.rotation = 0;
    this.name = stats.name;
    this.role = stats.role;
    this.color = stats.color;
    this.projectile = stats.projectile || "dot";
    this.hitEffect = stats.hitEffect || "spark";
    this.ability = stats.ability || null;
    this.abilityCooldown = 0;
    this.abilityActiveTimer = 0;
    this.abilityTickTimer = 0;
    this.beamTarget = null;
    this.beamRamp = 1;
    this.damageMultiplier = 1;
    this.fireRateMultiplier = 1;
    this.spent = stats.price;
    this.targetMode = "first";

    this.range = stats.range;
    this.damage = stats.damage;
    this.cooldownMax = stats.cooldown;
    this.cooldown = 0;
    this.bulletSpeed = stats.bulletSpeed;
    this.bulletSize = stats.bulletSize;
    this.pierce = stats.pierce || 1;
    this.critChance = stats.critChance || 0;
    this.critMultiplier = stats.critMultiplier || 1;
    this.armorPierce = stats.armorPierce || 0;
    this.splash = stats.splash || false;
    this.splashRadius = stats.splashRadius || 0;
    this.slowEffect = stats.slowEffect || 0;
    this.slowMultiplier = stats.slowMultiplier || 1;
    this.chainLightning = stats.chainLightning || false;
    this.chainTargets = stats.chainTargets || 0;
    this.chainRadius = stats.chainRadius || 0;
    this.chainDamageMultiplier = stats.chainDamageMultiplier || 0.5;

    this.levels = { damage: 1, range: 1, speed: 1 };
    this.size = stats.size || 94;
    this.kills = 0;
  }

aimAtTarget(target) {
  if (!target) return;

  const dx = target.x - this.x;
  const dy = target.y - this.y;

  this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
}


update() {
  if (this.abilityCooldown > 0) {
    this.abilityCooldown--;
  }

  if (this.abilityActiveTimer > 0) {
    this.abilityActiveTimer--;

    if (this.ability?.type === "infernoLaser") {
      this.updateInfernoLaser();
    }

    if (this.abilityActiveTimer === 0) {
      this.damageMultiplier = 1;
      this.fireRateMultiplier = 1;
      this.beamTarget = null;
      this.beamRamp = 1;

      if (this === selectedPlacedTower) {
        showMessage(`${this.ability.name} er ferdig.`);
      }
    }
  }

  if (this.cooldown > 0) {
    this.cooldown--;
  }

  const target = this.findTarget();

  if (target) {
    this.aimAtTarget(target);

    if (this.cooldown <= 0) {
      bullets.push(new Bullet(this, target));
      this.cooldown = Math.max(5, Math.round(this.cooldownMax * this.fireRateMultiplier));
    }
  }
}

  findTarget() {
    const candidates = enemies.filter(enemy => enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.range);
    if (candidates.length === 0) return null;

    if (this.targetMode === "strong") {
      return candidates.reduce((best, enemy) => enemy.hp > best.hp ? enemy : best);
    }

    if (this.targetMode === "close") {
      return candidates.reduce((best, enemy) => {
        const bestDistance = Math.hypot(best.x - this.x, best.y - this.y);
        const enemyDistance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        return enemyDistance < bestDistance ? enemy : best;
      });
    }

    if (this.targetMode === "last") {
      return candidates.reduce((best, enemy) => enemy.distanceTravelled < best.distanceTravelled ? enemy : best);
    }

    return candidates.reduce((best, enemy) => enemy.distanceTravelled > best.distanceTravelled ? enemy : best);
  }

  updateInfernoLaser() {
    if (
      !this.beamTarget ||
      !this.beamTarget.alive ||
      Math.hypot(this.beamTarget.x - this.x, this.beamTarget.y - this.y) > this.range
    ) {
      this.beamTarget = this.findTarget();
      this.beamRamp = 1;
    }

    if (!this.beamTarget) return;

    this.abilityTickTimer--;
    effects.push(new ContinuousBeam(this.x, this.y, this.beamTarget.x, this.beamTarget.y, "#f97316", this.beamRamp));

    if (this.abilityTickTimer <= 0) {
      const damage = Math.round(this.ability.baseDamage * this.beamRamp);
      damageEnemy(this.beamTarget, damage, this, this.armorPierce);
      effects.push(new ParticleBurst(this.beamTarget.x, this.beamTarget.y, "#f97316", 7, "lava"));
      this.beamRamp = Math.min(this.ability.maxRamp, this.beamRamp + this.ability.rampPerTick);
      this.abilityTickTimer = this.ability.tickRate;
    }
  }

  getUpgradeCost(kind) {
    const upgrade = getTowerUpgradeConfig(this.type, kind);
    const currentLevel = this.levels[kind];

    if (!upgrade) return null;
    if (currentLevel >= upgrade.maxLevel) return null;

    return Math.round(upgrade.costBase * Math.pow(upgrade.costGrowth, currentLevel - 1));
  }

  upgrade(kind) {
    const upgradeConfig = getTowerUpgradeConfig(this.type, kind);
    const globalUpgrade = GAME_CONFIG.upgrades[kind];

    if (!upgradeConfig || !globalUpgrade) {
      showMessage("Denne upgraden finnes ikke.");
      return;
    }

    const cost = this.getUpgradeCost(kind);

    if (cost === null) {
      showMessage(`${globalUpgrade.label} er maks level.`);
      updateUI();
      updatePlacedTowerInfo();
      return;
    }

    if (money < cost) {
      showMessage(`Du trenger ${formatMoney(cost - money)} mer.`);
      return;
    }

    money -= cost;
    this.spent += cost;
    this.levels[kind]++;

    if (kind === "damage") {
      this.damage = Math.round(this.damage * upgradeConfig.valueGrowth);

      if (this.levels.damage === 4) {
        this.pierce += 1;
      }
    }

    if (kind === "range") {
      this.range = Math.round(this.range * upgradeConfig.valueGrowth);
    }

    if (kind === "speed") {
      this.cooldownMax = Math.max(6, Math.round(this.cooldownMax * upgradeConfig.cooldownMultiplier));
    }

    effects.push(new RingEffect(this.x, this.y, this.range, this.color));
    showMessage(`${this.name} oppgradert: ${globalUpgrade.label}.`);
    updateUI();
    updatePlacedTowerInfo();
  }

  cycleTargetMode() {
    const index = targetModes.indexOf(this.targetMode);
    this.targetMode = targetModes[(index + 1) % targetModes.length];
    updatePlacedTowerInfo();
  }

  getSellValue() {
    return Math.round(this.spent * 0.72);
  }

  getAbilityStatus() {
    if (!this.ability) return "Ingen ability";
    if (!this.isAbilityUnlocked()) return "Låses opp med alle upgrades på Lv 3";
    if (this.abilityActiveTimer > 0) return `${this.ability.name}: aktiv`;
    if (this.abilityCooldown > 0) return `${this.ability.name}: ${Math.ceil(this.abilityCooldown / 60)}s`;
    return `${this.ability.name}: klar`;
  }

  isAbilityUnlocked() {
    return this.levels.damage >= 3 && this.levels.range >= 3 && this.levels.speed >= 3;
  }

  canUseAbility() {
    return this.ability && this.isAbilityUnlocked() && this.abilityCooldown <= 0 && this.abilityActiveTimer <= 0;
  }

  activateAbility() {
    if (!this.ability) {
      showMessage(`${this.name} har ingen ability.`);
      return;
    }

    if (!this.isAbilityUnlocked()) {
      showMessage(`${this.ability.name} låses opp når skade, range og fart er Lv 3.`);
      return;
    }

    if (this.abilityCooldown > 0) {
      showMessage(`${this.ability.name} er klar om ${Math.ceil(this.abilityCooldown / 60)}s.`);
      return;
    }

    if (this.ability.type === "overdrive") {
      this.abilityActiveTimer = this.ability.duration;
      this.damageMultiplier = this.ability.damageMultiplier;
      this.fireRateMultiplier = this.ability.fireRateMultiplier;
      effects.push(new RingEffect(this.x, this.y, this.range, this.color));
      effects.push(new ParticleBurst(this.x, this.y, this.color, 24, "spark"));
    }

    if (this.ability.type === "salvo") {
      const targets = enemies
        .filter(enemy => enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.range)
        .sort((a, b) => b.distanceTravelled - a.distanceTravelled);

      for (let i = 0; i < this.ability.shots; i++) {
        const target = targets[i % Math.max(1, targets.length)];
        if (target) {
          bullets.push(new Bullet(this, target, { damageMultiplier: this.ability.damageMultiplier, abilityShot: true }));
        }
      }

      effects.push(new ParticleBurst(this.x, this.y, this.color, 20, "shred"));
    }

    if (this.ability.type === "infernoLaser") {
      this.abilityActiveTimer = this.ability.duration;
      this.abilityTickTimer = 0;
      this.beamTarget = this.findTarget();
      this.beamRamp = 1;
      effects.push(new RingEffect(this.x, this.y, this.range, "#f97316"));
      effects.push(new ParticleBurst(this.x, this.y, "#f97316", 28, "lava"));
    }

    if (this.ability.type === "artillery") {
      effects.push(new BlastEffect(this.x, this.y, this.ability.radius, this.color));
      enemies.forEach(enemy => {
        if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.ability.radius) {
          damageEnemy(enemy, this.ability.damage, this, this.armorPierce);
          effects.push(new ParticleBurst(enemy.x, enemy.y, this.color, 8, "explosion"));
        }
      });
    }

    if (this.ability.type === "emp") {
      effects.push(new RingEffect(this.x, this.y, this.ability.radius, this.color));
      enemies.forEach(enemy => {
        if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.ability.radius) {
          damageEnemy(enemy, this.ability.damage, this, this.armorPierce);
          applySlow(enemy, this.ability.slowEffect, this.ability.slowMultiplier);
          effects.push(new ParticleBurst(enemy.x, enemy.y, this.color, 7, "emp"));
        }
      });
    }

    if (this.ability.type === "airstrike") {
      const targets = enemies
        .filter(enemy => enemy.alive)
        .sort((a, b) => b.distanceTravelled - a.distanceTravelled)
        .slice(0, this.ability.maxTargets);

      targets.forEach(enemy => {
        effects.push(new LaserStrike(this.x, this.y, enemy.x, enemy.y, this.color));
        damageEnemy(enemy, this.ability.damage, this, this.ability.armorPierce);
        effects.push(new ParticleBurst(enemy.x, enemy.y, this.color, 10, "pierce"));
      });
    }

    if (this.ability.type === "boardBomb") {
      effects.push(new BoardBombEffect(this.color, images[`ability-effect-${this.type}`]));
      enemies.forEach(enemy => {
        if (!enemy.alive) return;
        effects.push(new BlastEffect(enemy.x, enemy.y, 70, this.color));
        effects.push(new ParticleBurst(enemy.x, enemy.y, this.color, 14, "explosion"));
        damageEnemy(enemy, this.ability.damage, this, this.ability.armorPierce);
      });
    }

    if (this.ability.type === "lightningTornado") {
      if (!enemies.some(enemy => enemy.alive)) {
        showMessage(`${this.ability.name} trenger enemies på brettet.`);
        return;
      }

      effects.push(new LightningTornadoEffect(this, this.ability));
      effects.push(new RingEffect(this.x, this.y, this.range, "#facc15"));
    }

    this.abilityCooldown = this.ability.cooldown;
    showMessage(`${this.name}: ${this.ability.name}!`);
    updatePlacedTowerInfo();
  }

  draw() {
    const img = images[`tower-${this.type}`];
    const isSelected = this === selectedPlacedTower;
    const isHovered = this === hoveredTower;
    const isAbilityHovered = this === abilityHoverTower;

    if (isSelected || isHovered || isAbilityHovered) {
      drawRangeCircle(
        this.x,
        this.y,
        this.range,
        isSelected ? "rgba(34, 197, 94, 0.09)" : isAbilityHovered ? "rgba(239, 68, 68, 0.14)" : "rgba(147, 197, 253, 0.07)"
      );
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, 17, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = isSelected ? "#facc15" : isHovered ? "#bfdbfe" : this.color;
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.stroke();

    if (img && img.complete) {
      const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
      const width = aspect >= 1 ? this.size : this.size * aspect;
      const height = aspect >= 1 ? this.size / aspect : this.size;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    }

    const totalLevel = this.levels.damage + this.levels.range + this.levels.speed - 2;
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Lv ${totalLevel}`, this.x, this.y + 70);
  }
}

class Bullet {
  constructor(tower, target, options = {}) {
    this.x = tower.x;
    this.y = tower.y;
    this.source = tower;
    this.target = target;
    this.damage = Math.round(tower.damage * tower.damageMultiplier * (options.damageMultiplier || 1));
    this.speed = tower.bulletSpeed;
    this.size = tower.bulletSize;
    this.color = tower.color;
    this.projectile = tower.projectile;
    this.hitEffect = tower.hitEffect;
    this.icon = images[`projectile-${tower.type}`];
    this.effectIcon = images[`effect-${tower.type}`];
    this.rotation = 0;
    this.abilityShot = options.abilityShot || false;
    this.splash = tower.splash;
    this.splashRadius = tower.splashRadius;
    this.slowEffect = tower.slowEffect;
    this.slowMultiplier = tower.slowMultiplier;
    this.pierce = tower.pierce;
    this.armorPierce = tower.armorPierce;
    this.chainLightning = tower.chainLightning;
    this.chainTargets = tower.chainTargets;
    this.chainRadius = tower.chainRadius;
    this.chainDamageMultiplier = tower.chainDamageMultiplier;
    this.crit = Math.random() < tower.critChance;
    this.alive = true;
  }

  update() {
    if (!this.target || !this.target.alive) {
      this.target = this.source.findTarget();
      if (!this.target) {
        this.alive = false;
        return;
      }
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.hypot(dx, dy);
    this.rotation = Math.atan2(dy, dx);

    if (distance <= this.speed) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.hit();
      this.alive = false;
    } else {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }

  hit() {
    const damage = this.crit ? Math.round(this.damage * this.source.critMultiplier) : this.damage;
    spawnHitEffect(this.hitEffect, this.x, this.y, this.color, this.effectIcon);

    if (this.splash) {
      effects.push(new BlastEffect(this.x, this.y, this.splashRadius, this.color, this.effectIcon));
      enemies.forEach(enemy => {
        if (enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.splashRadius) {
          damageEnemy(enemy, damage, this.source, this.armorPierce);
        }
      });
      return;
    }

    const targets = enemies
      .filter(enemy => enemy.alive && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= 28)
      .sort((a, b) => b.distanceTravelled - a.distanceTravelled)
      .slice(0, this.pierce);

    if (!targets.includes(this.target) && this.target.alive) {
      targets.unshift(this.target);
    }

    targets.slice(0, this.pierce).forEach(enemy => {
      damageEnemy(enemy, damage, this.source, this.armorPierce);
      if (this.slowEffect > 0 && enemy.alive) {
        applySlow(enemy, this.slowEffect, this.slowMultiplier);
      }
    });

    if (this.chainLightning) {
      const chained = enemies
        .filter(enemy => enemy.alive && !targets.includes(enemy) && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.chainRadius)
        .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
        .slice(0, this.chainTargets);

      chained.forEach(enemy => {
        effects.push(new LaserStrike(this.x, this.y, enemy.x, enemy.y, "#facc15"));
        effects.push(new ParticleBurst(enemy.x, enemy.y, "#facc15", 7, "lightning"));
        damageEnemy(enemy, Math.round(damage * this.chainDamageMultiplier), this.source, this.armorPierce);
      });
    }

    if (this.crit) {
      effects.push(new FloatingText("CRIT", this.x, this.y - 18, "#facc15"));
    }
  }

  draw() {
    if (this.icon && this.icon.complete) {
      const isRoundProjectile = this.projectile === "pulse" || this.projectile === "popcorn" || this.projectile === "lightning";
      const width = isRoundProjectile ? this.size * 5 : this.size * 8;
      const height = isRoundProjectile ? this.size * 5 : this.size * 3.2;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.abilityShot || this.crit ? 14 : 6;
      ctx.drawImage(this.icon, -width / 2, -height / 2, width, height);
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + (this.crit ? 2 : 0), 0, Math.PI * 2);
    ctx.fillStyle = this.crit ? "#fde68a" : this.color;
    ctx.fill();
  }
}

class FloatingText {
  constructor(text, x, y, color) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 52;
    this.alive = true;
  }

  update() {
    this.y -= 0.55;
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    ctx.globalAlpha = Math.max(0, this.life / 52);
    ctx.fillStyle = this.color;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

class BlastEffect {
  constructor(x, y, radius, color, icon = null) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.icon = icon;
    this.life = 18;
    this.alive = true;
  }

  update() {
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    ctx.globalAlpha = this.life / 18;
    if (this.icon && this.icon.complete) {
      const size = this.radius * (2.25 - this.life / 28);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((18 - this.life) * 0.08);
      ctx.drawImage(this.icon, -size / 2, -size / 2, size, size);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (1.2 - this.life / 60), 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class ParticleBurst {
  constructor(x, y, color, count, style) {
    this.particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.6;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 18 + Math.random() * 18
      };
    });
    this.color = color;
    this.style = style;
    this.alive = true;
  }

  update() {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.life--;
    });
    this.particles = this.particles.filter(particle => particle.life > 0);
    this.alive = this.particles.length > 0;
  }

  draw() {
    this.particles.forEach(particle => {
      ctx.globalAlpha = Math.max(0, particle.life / 30);
      ctx.beginPath();
      if (this.style === "shred") {
        ctx.rect(particle.x, particle.y, particle.size * 1.8, particle.size);
      } else {
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      }
      ctx.fillStyle = this.style === "emp" ? "#67e8f9" : this.style === "lava" ? "#fb923c" : this.style === "lightning" ? "#facc15" : this.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}

class LaserStrike {
  constructor(x1, y1, x2, y2, color) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    this.life = 16;
    this.alive = true;
  }

  update() {
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    ctx.globalAlpha = this.life / 16;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = "#f5d0fe";
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

class ContinuousBeam {
  constructor(x1, y1, x2, y2, color, ramp) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.color = color;
    this.ramp = ramp;
    this.life = 3;
    this.alive = true;
  }

  update() {
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    const flicker = Math.sin(Date.now() / 45) * 1.5;
    const width = Math.min(18, 5 + this.ramp * 2.2 + flicker);
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = width + 10;
    ctx.stroke();

    ctx.globalAlpha = 0.56;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = "#fed7aa";
    ctx.lineWidth = width + 5;
    ctx.stroke();

    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = width;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = Math.max(2, width * 0.28);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

class BoardBombEffect {
  constructor(color, icon = null) {
    this.color = color;
    this.icon = icon;
    this.life = 42;
    this.alive = true;
  }

  update() {
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    const progress = 1 - this.life / 42;
    ctx.globalAlpha = 0.24 * (this.life / 42);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.72 * (this.life / 42);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80 + progress * 820, 0, Math.PI * 2);
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 18;
    ctx.stroke();

    if (this.icon && this.icon.complete) {
      const size = 110 + progress * 210;
      ctx.globalAlpha = Math.min(1, 0.25 + progress) * (this.life / 42);
      ctx.drawImage(this.icon, canvas.width / 2 - size / 2, canvas.height / 2 - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
  }
}

class LightningTornadoEffect {
  constructor(source, ability) {
    this.source = source;
    this.ability = ability;
    this.life = ability.duration;
    this.maxLife = ability.duration;
    this.tickTimer = 0;
    this.alive = true;
    this.x = source.x;
    this.y = source.y;
    this.targetDistance = 0;
  }

  update() {
    const frontEnemy = enemies
      .filter(enemy => enemy.alive)
      .sort((a, b) => b.distanceTravelled - a.distanceTravelled)[0];

    if (frontEnemy) {
      this.targetDistance = Math.min(totalPathLength - 1, frontEnemy.distanceTravelled + (this.ability.frontOffset || 80));
    }

    const point = getPointAtPathDistance(this.targetDistance);
    this.x = point.x;
    this.y = point.y;
    this.tickTimer--;

    if (this.tickTimer <= 0) {
      enemies.forEach(enemy => {
        if (!enemy.alive || Math.hypot(enemy.x - this.x, enemy.y - this.y) > this.ability.radius) return;
        moveEnemyToPathDistance(enemy, enemy.distanceTravelled - (this.ability.pushDistance || 6));
        applySlow(enemy, 12, 0.25);
        effects.push(new LaserStrike(this.x, this.y, enemy.x, enemy.y, "#facc15"));
      });
      this.tickTimer = this.ability.tickRate;
    }

    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    const pulse = Math.sin(Date.now() / 55) * 6;
    const remaining = this.life / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Date.now() / 110);

    ctx.globalAlpha = 0.22 * remaining;
    ctx.beginPath();
    ctx.arc(0, 0, this.ability.radius + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "#facc15";
    ctx.fill();

    ctx.globalAlpha = 0.9 * remaining;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
      ctx.lineTo(Math.cos(angle + 0.45) * (this.ability.radius * 0.85), Math.sin(angle + 0.45) * (this.ability.radius * 0.85));
      ctx.strokeStyle = i % 2 === 0 ? "#fef3c7" : "#38bdf8";
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#fef3c7";
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class RingEffect {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 24;
    this.alive = true;
  }

  update() {
    this.life--;
    this.alive = this.life > 0;
  }

  draw() {
    ctx.globalAlpha = (this.life / 24) * 0.45;
    drawRangeCircle(this.x, this.y, this.radius, this.color, 0.07, 0.22);
    ctx.globalAlpha = 1;
  }
}

function applySlow(enemy, duration, multiplier) {
  enemy.slowTimer = Math.max(enemy.slowTimer, duration);
  enemy.slowMultiplier = Math.min(enemy.slowMultiplier, multiplier);
}

function spawnHitEffect(kind, x, y, color, icon = null) {
  if (kind === "explosion") {
    effects.push(new BlastEffect(x, y, 44, color, icon));
    effects.push(new ParticleBurst(x, y, color, 12, kind));
    return;
  }

  if (kind === "emp") {
    effects.push(new RingEffect(x, y, 48, color));
    effects.push(new ParticleBurst(x, y, color, 10, kind));
    return;
  }

  if (kind === "pierce") {
    effects.push(new LaserStrike(x - 22, y - 8, x + 22, y + 8, color));
    effects.push(new ParticleBurst(x, y, color, 8, kind));
    return;
  }

  if (kind === "lightning") {
    effects.push(new LaserStrike(x - 26, y - 22, x + 26, y + 22, "#facc15"));
    effects.push(new LaserStrike(x - 18, y + 20, x + 20, y - 18, "#38bdf8"));
    effects.push(new ParticleBurst(x, y, "#facc15", 12, kind));
    return;
  }

  effects.push(new ParticleBurst(x, y, color, kind === "shred" ? 7 : 6, kind));
}

function damageEnemy(enemy, amount, source, armorPierce = 0) {
  if (!enemy.alive) return;

  const armorReduction = Math.max(0, enemy.armor - armorPierce);
  const finalDamage = Math.max(1, Math.round(amount - armorReduction));
  enemy.hp -= finalDamage;

  if (enemy.hp <= 0) {
    enemy.alive = false;
    if (enemy.type === "boss") {
      bossKills++;
    }
    enemy.split();
    money += enemy.reward;
    score += enemy.reward * 7;
    if (source) source.kills++;
    effects.push(new FloatingText(`+${enemy.reward}`, enemy.x, enemy.y, "#86efac"));
    updateUI();
  }
}

function drawMap() {
  if (mapImage.complete) {
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#14213d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawPath();
  drawPlacementGhost();
}

function drawPath() {
  const path = GAME_CONFIG.map.path;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = GAME_CONFIG.map.pathWidth;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.56)";
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }

  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(248, 250, 252, 0.34)";
  ctx.stroke();
}

function drawRangeCircle(x, y, range, color, fillAlpha = null, strokeAlpha = null) {
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  const fillColor = fillAlpha === null ? color : colorToRgba(color, fillAlpha);
  const strokeColor = strokeAlpha === null ? colorToRgba(color, 0.22) : colorToRgba(color, strokeAlpha);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function colorToRgba(color, alpha) {
  if (color.startsWith("rgba")) {
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${alpha})`);
  }

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const fullHex = hex.length === 3 ? hex.split("").map(char => char + char).join("") : hex;
    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

function drawPlacementGhost() {
  if (pendingPlacement) {
    const tower = GAME_CONFIG.towers[pendingPlacement.type];
    drawRangeCircle(pendingPlacement.x, pendingPlacement.y, tower.range, "rgba(250, 204, 21, 0.08)");
    ctx.beginPath();
    ctx.arc(pendingPlacement.x, pendingPlacement.y, 32, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(250, 204, 21, 0.46)";
    ctx.fill();
    return;
  }

  if (!mouse.inside || selectedPlacedTower || gameOver || !selectedTowerType) return;

  const tower = GAME_CONFIG.towers[selectedTowerType];
  const valid = canPlaceTower(mouse.x, mouse.y, selectedTowerType).ok && money >= tower.price;

  drawRangeCircle(mouse.x, mouse.y, tower.range, valid ? "rgba(34, 197, 94, 0.07)" : "rgba(248, 113, 113, 0.08)");
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 29, 0, Math.PI * 2);
  ctx.fillStyle = valid ? "rgba(34, 197, 94, 0.42)" : "rgba(248, 113, 113, 0.46)";
  ctx.fill();
}

function startWave() {
  if (!gameStarted) {
    showMessage("Skriv inn navn og trykk Start game først.");
    return;
  }

  if (waveRunning || gameOver || victory) return;

  resetAbilityTimers();
  const waveConfig = getWaveConfig();
  spawnQueue = [];
  waveConfig.groups.forEach(group => {
    for (let i = 0; i < group.count; i++) {
      spawnQueue.push({ type: group.type, gap: group.gap });
    }
  });

  waveRunning = true;
  spawnTimer = 0;
  selectedPlacedTower = null;
  showMessage(`Wave ${wave}: ${waveConfig.name}`);
  updateUI();
}

function spawnEnemy(type) {
  if (!GAME_CONFIG.enemies[type]) return;
  enemies.push(new Enemy(type));
}

function resetAbilityTimers() {
  towers.forEach(tower => {
    tower.abilityCooldown = 0;
    tower.abilityActiveTimer = 0;
    tower.damageMultiplier = 1;
    tower.fireRateMultiplier = 1;
    tower.beamTarget = null;
    tower.beamRamp = 1;
  });
  effects = effects.filter(effect => !(effect instanceof LightningTornadoEffect));
  updateAbilityList();
  updatePlacedTowerInfo();
}

function updateTowerDropdownLabel() {
  if (selectedTowerType && isTowerUnlocked(selectedTowerType)) {
    const tower = GAME_CONFIG.towers[selectedTowerType];
    towerDropdownBtn.textContent = `${tower.name} - ${formatMoney(tower.price)}`;
    return;
  }

  towerDropdownBtn.textContent = "Velg tårn";
}

function createTowerMenu() {
  towerSelect.innerHTML = "";
  updateTowerDropdownLabel();

  Object.entries(GAME_CONFIG.towers).forEach(([key, tower]) => {
    const card = document.createElement("div");
    card.className = "tower-card";
    const locked = !isTowerUnlocked(key);
    const limitReached = !locked && isTowerLimitReached(key);
    if (key === selectedTowerType) card.classList.add("selected");
    if (locked) card.classList.add("locked");
    if (limitReached) card.classList.add("limit-reached");

    card.innerHTML = `
      <span class="secret-icon">${locked ? "?" : `<img src="${tower.icon}" alt="${tower.name}">`}</span>
      <span>
        <strong>${locked ? "Hemmelig tårn" : tower.name}</strong>
        <span>${locked ? `Lås opp: ${formatMoney(tower.unlockCost)}` : formatMoney(tower.price)}</span>
        <small>${locked ? "Kjøp tilgang for å avsløre" : `${tower.role} · ${getTowerLimitText(key)}`}</small>
      </span>
    `;

    card.addEventListener("click", () => {
      if (locked) {
        if (money < tower.unlockCost) {
          showMessage(`Du trenger ${formatMoney(tower.unlockCost - money)} mer for å låse opp det hemmelige tårnet.`);
          return;
        }

        money -= tower.unlockCost;
        unlockedTowerTypes.add(key);
        showMessage(`${tower.name} er avslørt. Nå kan du kjøpe tårnet.`);
        createTowerMenu();
        updateUI();
        return;
      }

      if (limitReached) {
        showMessage(`Du kan bare ha ${getTowerPlacementLimit(key)} av ${tower.name}.`);
        return;
      }

      selectedTowerType = selectedTowerType === key ? null : key;
      selectedPlacedTower = null;
      pendingPlacement = null;

      towerSelect.classList.remove("open");
      
      createTowerMenu();
      updateSelectedTowerInfo();
      updatePlacedTowerInfo();
      updateCanvasCursor();
      updateTowerDropdownLabel();
      showMessage(selectedTowerType ? `${tower.name} valgt.` : "Byggemodus av.");
    });

    towerSelect.appendChild(card);
  });
}

function updateSelectedTowerInfo() {
  if (!selectedTowerType) {
    selectedTowerBox.textContent = "Ingen tårn valgt. Klikk et tårn for å bygge, eller klikk et plassert tårn for upgrades.";
    return;
  }

  const tower = GAME_CONFIG.towers[selectedTowerType];
  if (!isTowerUnlocked(selectedTowerType)) {
    selectedTowerBox.textContent = `${tower.name} er låst. Kjøp tilgang i tårnmenyen først.`;
    return;
  }

  selectedTowerBox.innerHTML = `
    <strong>${tower.name}</strong> - ${tower.role}<br>
    Pris: ${formatMoney(tower.price)}<br>
    Antall: ${getTowerLimitText(selectedTowerType)}<br>
    Skade: ${tower.damage} | Fart: ${tower.cooldown}<br>
    Rekkevidde: ${tower.range} | Pierce: ${tower.pierce || 1}<br>
    Prosjektil: ${tower.projectile}<br>
    Ability: ${tower.ability ? tower.ability.name : "Ingen"}<br>
    ${tower.description}
  `;
}

function createAbilityCard(tower, index) {
  const button = document.createElement("button");
  const towerConfig = GAME_CONFIG.towers[tower.type];
  const abilityIcon = tower.ability.icon || towerConfig.icon;
  const isReady = tower.canUseAbility();
  const isLocked = !tower.isAbilityUnlocked();
  const isActive = tower.abilityActiveTimer > 0;
  const cooldownText = isLocked
    ? "Låst: alle upgrades Lv 3"
    : isActive
    ? `Aktiv ${Math.ceil(tower.abilityActiveTimer / 60)}s`
    : tower.abilityCooldown > 0
      ? `${Math.ceil(tower.abilityCooldown / 60)}s cooldown`
      : "Klar";

  button.className = `ability-card ${isReady ? "ready" : ""} ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`;
  button.setAttribute("aria-disabled", String(!isReady));
  button.innerHTML = `
    <img src="${abilityIcon}" alt="${tower.ability.name}">
    <span>
      <strong>${index + 1}. ${tower.ability.name}</strong>
      <span>${tower.name} - ${cooldownText}</span>
    </span>
  `;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    tower.activateAbility();

    updatePlacedTowerInfo();
  });

  button.addEventListener("pointerenter", () => {
    abilityHoverTower = tower;
  });

  button.addEventListener("pointerleave", () => {
  if (abilityHoverTower === tower) {
    abilityHoverTower = null;
    }
  });

  button.addEventListener("pointercancel", () => {
  if (abilityHoverTower === tower) {
    abilityHoverTower = null;
    }
  });

  button.addEventListener("click", () => {
    abilityHoverTower = null;
  });

  return button;
}

function updateAbilityList() {
  const abilityTowers = towers.filter(tower => tower.ability);
  abilityList.innerHTML = "";

  if (abilityHoverTower && !abilityTowers.includes(abilityHoverTower)) {
    abilityHoverTower = null;
  }

  if (abilityTowers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Plasser tårn for abilities.";
    abilityList.appendChild(empty);
    return;
  }

  const groupedAbilities = {};

  abilityTowers.forEach(tower => {
    if (!groupedAbilities[tower.type]) {
      groupedAbilities[tower.type] = [];
    }

    groupedAbilities[tower.type].push(tower);
  });

  Object.entries(groupedAbilities).forEach(([type, towersInFolder]) => {
    abilityList.appendChild(createAbilityFolder(type, towersInFolder));
  });
}

function updateWavePreview() {
  const waveConfig = getWaveConfig();
  wavePreviewList.innerHTML = "";

  waveConfig.groups.forEach(group => {
    const enemy = GAME_CONFIG.enemies[group.type];
    const item = document.createElement("div");
    item.className = "wave-preview-item";
    item.innerHTML = `
      <img src="${enemy.icon}" alt="${enemy.name}">
      <span>${getEnemyDisplayName(group.type)}</span>
      <strong>x${group.count}</strong>
    `;
    wavePreviewList.appendChild(item);
  });
}

function createAbilityFolder(type, towersInFolder) {
  const towerConfig = GAME_CONFIG.towers[type];

  const folder = document.createElement("div");
  folder.className = "ability-folder";

  folder.innerHTML = `
    <button class="ability-folder-header" type="button">
      <img src="${towerConfig.icon}" alt="${towerConfig.name}">
      <span>
        <strong>${towerConfig.name}</strong>
        <small>${towersInFolder.length} ability${towersInFolder.length === 1 ? "" : "s"}</small>
      </span>
    </button>
    <div class="ability-folder-content"></div>
  `;

  const header = folder.querySelector(".ability-folder-header");
  const content = folder.querySelector(".ability-folder-content");

  header.addEventListener("click", () => {
    folder.classList.toggle("open");
  });

  towersInFolder.forEach((tower, index) => {
    content.appendChild(createAbilityCard(tower, index));
  });

  return folder;
}

function updateBossBar() {
  const bosses = enemies.filter(enemy => enemy.alive && enemy.type === "boss");

  if (bosses.length === 0) {
    bossPanel.classList.add("hidden");
    return;
  }

  const totalHp = bosses.reduce((total, enemy) => total + Math.max(0, enemy.hp), 0);
  const totalMaxHp = bosses.reduce((total, enemy) => total + enemy.maxHp, 0);
  const hpPercent = totalMaxHp > 0 ? Math.max(0, Math.min(100, (totalHp / totalMaxHp) * 100)) : 0;

  bossPanel.classList.remove("hidden");
  bossNameText.textContent = bosses.length > 1 ? `Simonsen x${bosses.length}` : bosses[0].stats.name;
  bossHpText.textContent = `${Math.ceil(hpPercent)}%`;
  bossBarFill.style.width = `${hpPercent}%`;
}

function updateAchievements() {
  achievementDefinitions.forEach(achievement => {
    if (!unlockedAchievements.has(achievement.id) && achievement.check()) {
      unlockedAchievements.add(achievement.id);
      showMessage(`Achievement: ${achievement.label}`);
      showAchievementPopup(achievement.label);
    }
  });

  achievementDropdownBtn.textContent = `Achievements ${unlockedAchievements.size}/${achievementDefinitions.length}`;

  achievementList.innerHTML = "";
  achievementDefinitions.forEach(achievement => {
    const item = document.createElement("div");
    const unlocked = unlockedAchievements.has(achievement.id);
    item.className = `achievement-item ${unlocked ? "unlocked" : ""}`;
    item.innerHTML = `
      <span>${unlocked ? "✓" : "○"}</span>
      <strong>${achievement.label}</strong>
    `;
    achievementList.appendChild(item);
  });
}

function getUpgradeButtonText(kind, cost) {
  if (!selectedPlacedTower) return "";

  const globalUpgrade = GAME_CONFIG.upgrades[kind];
  const towerUpgrade = getTowerUpgradeConfig(selectedPlacedTower.type, kind);

  if (!globalUpgrade || !towerUpgrade) {
    return "Upgrade mangler";
  }

  const label = globalUpgrade.label;
  const level = selectedPlacedTower.levels[kind];
  const maxLevel = towerUpgrade.maxLevel;

  if (cost === null) {
    return `${label}\nLv ${level}/${maxLevel} - maks`;
  }

  return `${label}\nLv ${level} -> ${level + 1} - ${formatMoney(cost)}`;
}

function updatePlacedTowerInfo() {
  const upgradeButtons = [upgradeDamageBtn, upgradeRangeBtn, upgradeSpeedBtn, targetModeBtn, sellTowerBtn];

  if (!selectedPlacedTower) {
    selectedPlacedTowerBox.textContent = "Klikk på et plassert tårn for upgrades, target mode eller salg.";
    upgradeButtons.forEach(button => button.disabled = true);
    targetModeBtn.textContent = "Target: First";
    return;
  }

  const damageCost = selectedPlacedTower.getUpgradeCost("damage");
  const rangeCost = selectedPlacedTower.getUpgradeCost("range");
  const speedCost = selectedPlacedTower.getUpgradeCost("speed");

  selectedPlacedTowerBox.innerHTML = `
    <strong>${selectedPlacedTower.name}</strong> (${selectedPlacedTower.role})<br>
    Kills: ${selectedPlacedTower.kills} | Target: ${targetModeLabels[selectedPlacedTower.targetMode]}<br>
    Skade: ${selectedPlacedTower.damage} (Lv ${selectedPlacedTower.levels.damage})<br>
    Range: ${selectedPlacedTower.range} (Lv ${selectedPlacedTower.levels.range})<br>
    Fart: ${selectedPlacedTower.cooldownMax} cd (Lv ${selectedPlacedTower.levels.speed})<br>
    Ability: ${selectedPlacedTower.getAbilityStatus()}<br>
    Selgeverdi: ${formatMoney(selectedPlacedTower.getSellValue())}
  `;

  upgradeDamageBtn.textContent = getUpgradeButtonText("damage", damageCost);
  upgradeRangeBtn.textContent = getUpgradeButtonText("range", rangeCost);
  upgradeSpeedBtn.textContent = getUpgradeButtonText("speed", speedCost);
  targetModeBtn.textContent = `Target: ${targetModeLabels[selectedPlacedTower.targetMode]}`;
  targetModeBtn.disabled = false;
  sellTowerBtn.disabled = false;
  upgradeDamageBtn.disabled = damageCost === null;
  upgradeRangeBtn.disabled = rangeCost === null;
  upgradeSpeedBtn.disabled = speedCost === null;
}

function updateUI() {
  const waveConfig = getWaveConfig();
  livesText.textContent = lives;
  moneyText.textContent = money;
  waveText.textContent = victory ? "V" : wave;
  scoreText.textContent = score;
  waveNameText.textContent = victory ? "Seier" : waveConfig.name;
  wavePreviewText.textContent = victory ? "Basen er sikret" : `${getWaveEnemyCount(waveConfig)} fiender`;
  startWaveBtn.disabled = waveRunning || gameOver || victory;
  startWaveBtn.textContent = waveRunning ? `${spawnQueue.length} igjen` : victory ? "Fullført" : "Start wave";
  pauseBtn.textContent = paused ? ">" : "II";
  speedBtn.textContent = `Speed: ${speedMultiplier}x`;
  updateWavePreview();
  updateBossBar();
  updateAchievements();
  updatePlacedTowerInfo();
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function getPointAtPathDistance(distance) {
  let remaining = Math.max(0, Math.min(totalPathLength, distance));

  for (const segment of pathSegments) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
        y: segment.a.y + (segment.b.y - segment.a.y) * ratio
      };
    }

    remaining -= segment.length;
  }

  return GAME_CONFIG.map.path[GAME_CONFIG.map.path.length - 1];
}

function getPathIndexAtPathDistance(distance) {
  let remaining = Math.max(0, Math.min(totalPathLength, distance));

  for (let index = 0; index < pathSegments.length; index++) {
    if (remaining <= pathSegments[index].length) return index;
    remaining -= pathSegments[index].length;
  }

  return Math.max(0, GAME_CONFIG.map.path.length - 2);
}

function moveEnemyToPathDistance(enemy, distance) {
  const nextDistance = Math.max(0, Math.min(totalPathLength - 1, distance));
  const point = getPointAtPathDistance(nextDistance);
  enemy.distanceTravelled = nextDistance;
  enemy.pathIndex = getPathIndexAtPathDistance(nextDistance);
  enemy.x = point.x;
  enemy.y = point.y;
}

function isOnPath(x, y) {
  return pathSegments.some(segment => distanceToSegment({ x, y }, segment.a, segment.b) < GAME_CONFIG.map.pathWidth / 2 + 22);
}

function getClickedTower(x, y) {
  return towers.find(tower => Math.hypot(tower.x - x, tower.y - y) <= 42);
}

function deselectAll(message = "Ingen tårn valgt.") {
  selectedTowerType = null;
  selectedPlacedTower = null;
  pendingPlacement = null;
  createTowerMenu();
  updateTowerDropdownLabel();
  updateSelectedTowerInfo();
  updatePlacedTowerInfo();
  updateCanvasCursor();
  showMessage(message);
}

function updateCanvasCursor() {
  if (selectedTowerType || pendingPlacement) {
    canvas.style.cursor = "crosshair";
    return;
  }

  canvas.style.cursor = hoveredTower ? "pointer" : "default";
}

function canPlaceTower(x, y, type = selectedTowerType) {
  if (type && isTowerLimitReached(type)) {
    const tower = GAME_CONFIG.towers[type];
    return { ok: false, reason: `Du kan bare ha ${getTowerPlacementLimit(type)} av ${tower.name}.` };
  }

  if (x < 36 || y < 36 || x > canvas.width - 36 || y > canvas.height - 36) {
    return { ok: false, reason: "For nær kanten." };
  }

  if (isOnPath(x, y)) {
    return { ok: false, reason: "Du kan ikke bygge på ruten." };
  }

  if (towers.some(tower => Math.hypot(tower.x - x, tower.y - y) < 82)) {
    return { ok: false, reason: "For nær et annet tårn." };
  }

  return { ok: true };
}

function getCanvasPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

canvas.addEventListener("mousemove", (event) => {
  mouse = { ...getCanvasPosition(event), inside: true };
  hoveredTower = getClickedTower(mouse.x, mouse.y);
  updateCanvasCursor();
});

canvas.addEventListener("mouseleave", () => {
  mouse.inside = false;
  hoveredTower = null;
  updateCanvasCursor();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  deselectAll("Byggemodus av.");
});

canvas.addEventListener("click", (event) => {
  if (gameOver || victory) return;

  const { x, y } = getCanvasPosition(event);
  const clickedTower = getClickedTower(x, y);
  if (clickedTower) {
    selectedPlacedTower = clickedTower;
    selectedTowerType = null;
    pendingPlacement = null;
    createTowerMenu();
    updateSelectedTowerInfo();
    updatePlacedTowerInfo();
    updateCanvasCursor();
    showMessage(`${clickedTower.name} valgt.`);
    return;
  }

  selectedPlacedTower = null;
  if (!selectedTowerType) {
    pendingPlacement = null;
    updatePlacedTowerInfo();
    updateCanvasCursor();
    showMessage("Ingen tårn valgt. Velg et tårn på høyresiden for å bygge.");
    return;
  }

  const towerStats = GAME_CONFIG.towers[selectedTowerType];
  const placement = canPlaceTower(x, y, selectedTowerType);

  if (money < towerStats.price) {
    showMessage(`Du trenger ${formatMoney(towerStats.price - money)} mer for ${towerStats.name}.`);
    updatePlacedTowerInfo();
    return;
  }

  if (!placement.ok) {
    showMessage(placement.reason);
    updatePlacedTowerInfo();
    return;
  }

  if (
    !pendingPlacement ||
    pendingPlacement.type !== selectedTowerType ||
    Math.hypot(pendingPlacement.x - x, pendingPlacement.y - y) > 38
  ) {
    pendingPlacement = { x, y, type: selectedTowerType };
    showMessage(`Bekreft ${towerStats.name} for ${formatMoney(towerStats.price)}: klikk samme sted igjen.`);
    updatePlacedTowerInfo();
    return;
  }

  const tower = new Tower(pendingPlacement.x, pendingPlacement.y, pendingPlacement.type);
  towers.push(tower);
  updateAbilityList();
  selectedPlacedTower = tower;
  selectedTowerType = null;
  pendingPlacement = null;
  money -= towerStats.price;
  effects.push(new RingEffect(tower.x, tower.y, tower.range, tower.color));
  showMessage(`${tower.name} plassert.`);
  createTowerMenu();
  updateSelectedTowerInfo();
  updateCanvasCursor();
  updateUI();
});

startWaveBtn.addEventListener("click", startWave);

towerDropdownBtn.addEventListener("click", () => {
  towerSelect.classList.toggle("open");
});

achievementDropdownBtn.addEventListener("click", () => {
  achievementList.classList.toggle("open");
});

pauseBtn.addEventListener("click", () => {
  if (gameOver || victory) return;
  paused = !paused;
  showMessage(paused ? "Pause." : "Spillet fortsetter.");
  updateUI();
});

speedBtn.addEventListener("click", () => {
  speedMultiplier = speedMultiplier === 1 ? 2 : 1;
  showMessage(`Speed satt til ${speedMultiplier}x.`);
  updateUI();
});

restartBtn.addEventListener("click", () => {
  restartGame();
});

upgradeDamageBtn.addEventListener("click", () => {
  if (selectedPlacedTower) selectedPlacedTower.upgrade("damage");
});

upgradeRangeBtn.addEventListener("click", () => {
  if (selectedPlacedTower) selectedPlacedTower.upgrade("range");
});

upgradeSpeedBtn.addEventListener("click", () => {
  if (selectedPlacedTower) selectedPlacedTower.upgrade("speed");
});

targetModeBtn.addEventListener("click", () => {
  if (!selectedPlacedTower) return;
  selectedPlacedTower.cycleTargetMode();
  showMessage(`${selectedPlacedTower.name} sikter nå på ${targetModeLabels[selectedPlacedTower.targetMode]}.`);
});

sellTowerBtn.addEventListener("click", () => {
  if (!selectedPlacedTower) return;
  const value = selectedPlacedTower.getSellValue();
  towers = towers.filter(tower => tower !== selectedPlacedTower);
  updateAbilityList();
  money += value;
  showMessage(`Solgte tårn for ${formatMoney(value)}.`);
  selectedPlacedTower = null;
  createTowerMenu();
  updateSelectedTowerInfo();
  updatePlacedTowerInfo();
  updateCanvasCursor();
  updateUI();
});

function giveMoney(amount = 10000) {
  money += amount;
  updateUI();
  showMessage(`Du fikk ${formatMoney(amount)}.`);
}

window.addEventListener("keydown", (event) => {

  if (event.altKey && event.shiftKey && event.key.toLowerCase() === "m") {
    event.preventDefault();
    giveMoney(10000);
  }
  
  if (event.code === "Space") {
    event.preventDefault();
    if (!waveRunning) startWave();
  }

  if (event.key.toLowerCase() === "p") {
    paused = !paused;
    updateUI();
  }

  if (event.key.toLowerCase() === "r") {
    restartGame();
  }

  if (event.key === "1") {
    speedMultiplier = 1;
    updateUI();
  }

  if (event.key === "2") {
    speedMultiplier = 2;
    updateUI();
  }

  if (event.key === "Escape") {
    deselectAll("Byggemodus av.");
  }
});

function updateSpawning() {
  if (!waveRunning) return;

  spawnTimer--;
  if (spawnTimer <= 0 && spawnQueue.length > 0) {
    const next = spawnQueue.shift();
    spawnEnemy(next.type);
    spawnTimer = next.gap;
  }

  if (waveRunning && spawnQueue.length === 0 && enemies.length === 0) {
    waveRunning = false;
    const bonus = GAME_CONFIG.waveBonus + wave * 18 + lives;
    money += bonus;
    score += bonus * 3;
    effects.push(new FloatingText(`Wave clear +${bonus}`, canvas.width / 2, 90, "#86efac"));

    if (wave >= GAME_CONFIG.maxWaves) {
      victory = true;
      showMessage("Seier! Alle waves er slått tilbake.");
    } else {
      wave++;
      showMessage(`Wave fullført. Bonus: ${formatMoney(bonus)}.`);
    }

    resetAbilityTimers();
    updateUI();
  }
}

function restartGame() {
  lives = GAME_CONFIG.startingLives;
  money = GAME_CONFIG.startingMoney;
  wave = 1;
  score = 0;
  enemies = [];
  towers = [];
  bullets = [];
  effects = [];
  spawnQueue = [];
  selectedTowerType = null;
  selectedPlacedTower = null;
  hoveredTower = null;
  abilityHoverTower = null;
  pendingPlacement = null;
  waveRunning = false;
  spawnTimer = 0;
  gameOver = false;
  victory = false;
  paused = false;
  scoreSubmitted = false;
  gameStarted = true;
  scoreboardOverlay.classList.add("hidden");
  speedMultiplier = 1;
  bossKills = 0;
  unlockedAchievements.clear();
  unlockedTowerTypes.clear();
  Object.entries(GAME_CONFIG.towers).forEach(([key, tower]) => {
    if (!tower.unlockCost) unlockedTowerTypes.add(key);
  });

  createTowerMenu();
  updateSelectedTowerInfo();
  updatePlacedTowerInfo();
  updateAbilityList();
  updateCanvasCursor();
  updateTowerDropdownLabel();
  updateUI();
  showMessage("Spillet er restartet.");
}

function updateGameStep() {
  updateSpawning();
  enemies.forEach(enemy => enemy.update());
  towers.forEach(tower => tower.update());
  bullets.forEach(bullet => bullet.update());
  effects.forEach(effect => effect.update());

  enemies = enemies.filter(enemy => enemy.alive);
  bullets = bullets.filter(bullet => bullet.alive);
  effects = effects.filter(effect => effect.alive);
}

function drawEndScreen(title, subtitle) {
  ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 56px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 35);

  ctx.font = "22px Arial";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 12);
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 46);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();

  if (!paused && !gameOver && !victory) {
    for (let i = 0; i < speedMultiplier; i++) {
      updateGameStep();
    }

    if (selectedPlacedTower) {
      updatePlacedTowerInfo();
    }
    updateBossBar();
    updateAchievements();
  }

  towers.forEach(tower => tower.draw());
  enemies.forEach(enemy => enemy.draw());
  bullets.forEach(bullet => bullet.draw());
  effects.forEach(effect => effect.draw());

  if (paused && !gameOver && !victory) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.48)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
  }

  if (gameOver) {
    drawEndScreen("GAME OVER", "Basen falt.");
  }

  if (victory) {
    drawEndScreen("VICTORY", "CRU-linjen holdt.");
  }

  requestAnimationFrame(gameLoop);
}

function startGameWithName() {
  const name = playerNameInput.value.trim();

  if (!name) {
    showMessage("Skriv inn player name først.");
    playerNameInput.focus();
    return;
  }

  playerName = name.slice(0, 18);
  localStorage.setItem("playerName", playerName);

  gameStarted = true;
  scoreSubmitted = false;

  startOverlay.classList.add("hidden");
  scoreboardOverlay.classList.add("hidden");

  showMessage(`Velkommen, ${playerName}. Trykk Start wave.`);
}

function submitFinalScore() {
  if (scoreSubmitted) return;
  if (!playerName) return;

  scoreSubmitted = true;

  db.collection("scores").add({
    name: playerName,
    score: score,
    wave: wave,
    bossKills: bossKills,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    loadScores();
  })
  .catch(error => {
    console.error(error);
    scoreboardList.textContent = "Kunne ikke sende score.";
  });
}

function showScoreboard() {
  finalScoreText.textContent = `Score: ${score}`;
  finalWaveText.textContent = `Wave: ${wave}`;
  scoreboardOverlay.classList.remove("hidden");
  loadScores();
}

function loadScores() {
  scoreboardList.textContent = "Loading...";

  db.collection("scores")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      scoreboardList.innerHTML = "";

      if (snapshot.empty) {
        scoreboardList.textContent = "Ingen scores enda.";
        return;
      }

      let place = 1;

      snapshot.forEach(doc => {
        const data = doc.data();

        const row = document.createElement("div");
        row.className = "scoreboard-row";

        row.innerHTML = `
          <strong>#${place}</strong>
          <span>
            ${escapeHtml(data.name || "Player")}
            <small>Wave ${data.wave || 0}</small>
          </span>
          <strong>${data.score || 0}</strong>
        `;

        scoreboardList.appendChild(row);
        place++;
      });
    })
    .catch(error => {
      console.error(error);
      scoreboardList.textContent = "Kunne ikke hente scoreboard.";
    });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function handleGameOverScoreboard() {
  submitFinalScore();
  showScoreboard();
}

startGameBtn.addEventListener("click", startGameWithName);

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startGameWithName();
  }
});

playAgainBtn.addEventListener("click", () => {
  scoreboardOverlay.classList.add("hidden");
  restartGame();
});

if (playerNameInput) {
  playerNameInput.value = playerName;
}

createTowerMenu();
updateSelectedTowerInfo();
updatePlacedTowerInfo();
updateAbilityList();
updateUI();
updateCanvasCursor();
updateTowerDropdownLabel();
gameLoop();