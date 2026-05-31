const GAME_CONFIG = {
  startingLives: 120,
  startingMoney: 400,
  waveBonus: 100,
  maxWaves: 40,

  map: {
    image: "assets/maps/map.png",
    pathWidth: 86,
    path: [
      { x: 0, y: 478 },
      { x: 285, y: 478 },
      { x: 285, y: 158 },
      { x: 744, y: 158 },
      { x: 744, y: 418 },
      { x: 590, y: 418 },
      { x: 590, y: 670 },
      { x: 1050, y: 670 },
      { x: 1050, y: 288 },
      { x: 1280, y: 288 }
    ]
  },

  towers: {
    skulbru: {
      name: "SKULBRU",
      role: "Multirolle",
      icon: "assets/towers/Skulbru.png",
      price: 160,
      range: 130,
      damage: 38,
      cooldown: 38,
      bulletSpeed: 10,
      bulletSize: 5,
      color: "#60a5fa",
      projectile: "tracer",
      projectileIcon: "assets/projectiles/tracer.svg",
      hitEffect: "spark",
      pierce: 1,
      critChance: 0.12,
      critMultiplier: 2,
      ability: {
        name: "Testoboost",
        icon: "assets/abilities/afterburner.svg",
        type: "overdrive",
        cooldown: 720,
        duration: 300,
        damageMultiplier: 1.55,
        fireRateMultiplier: 0.48,
        description: "Dobbel skytefart og mer skade en kort stund."
      },
      upgrades: {
        damage: { maxLevel: 7, costBase: 75, costGrowth: 1.68, valueGrowth: 1.16 },
        range: { maxLevel: 3, costBase: 65, costGrowth: 1.58, valueGrowth: 1.08 },
        speed: { maxLevel: 3, costBase: 85, costGrowth: 1.70, cooldownMultiplier: 0.93 }
      },
      description: "Stor gutt som spiser alt han ser."
    },

    leah: {
      name: "LEAH",
      role: "Rask ild",
      icon: "assets/towers/Leah.png",
      price: 110,
      range: 130,
      damage: 18,
      cooldown: 16,
      bulletSpeed: 9,
      bulletSize: 4,
      color: "#22c55e",
      projectile: "dart",
      projectileIcon: "assets/projectiles/Popcorn.png",
      hitEffect: "shred",
      pierce: 1,
      ability: {
        name: "EYE OF SAURON",
        icon: "assets/abilities/eye-of-sauron.svg",
        type: "infernoLaser",
        cooldown: 780,
        duration: 360,
        tickRate: 5,
        baseDamage: 10,
        rampPerTick: 0.09,
        maxRamp: 5.5,
        description: "Låser en inferno-ildstråle på ett mål og gjør mer skade jo lenger den brenner."
      },
      upgrades: {
        damage: { maxLevel: 8, costBase: 55, costGrowth: 1.62, valueGrowth: 1.12 },
        range: { maxLevel: 3, costBase: 45, costGrowth: 1.52, valueGrowth: 1.08 },
        speed: { maxLevel: 9, costBase: 70, costGrowth: 1.66, cooldownMultiplier: 0.84 }
      },
      description: "Billig og rask. Best mot mange små mål."
    },

    aaberg: {
      name: "AABERG",
      role: "Eksplosiv",
      icon: "assets/towers/Aaberg.png",
      price: 245,
      range: 260,
      damage: 50,
      cooldown: 74,
      bulletSpeed: 10,
      bulletSize: 7,
      color: "#f97316",
      projectile: "rocket",
      projectileIcon: "assets/projectiles/rocket.svg",
      hitEffect: "explosion",
      effectIcon: "assets/effects/aaberg-explosion.svg",
      pierce: 1,
      splash: true,
      splashRadius: 72,
      ability: {
        name: "Artilleri",
        icon: "assets/abilities/artillery.svg",
        type: "artillery",
        cooldown: 900,
        radius: 190,
        damage: 260,
        description: "Kraftig eksplosjon rundt tårnet."
      },
      upgrades: {
        damage: { maxLevel: 6, costBase: 115, costGrowth: 1.82, valueGrowth: 1.20 },
        range: { maxLevel: 6, costBase: 90, costGrowth: 1.70, valueGrowth: 1.12 },
        speed: { maxLevel: 5, costBase: 125, costGrowth: 1.88, cooldownMultiplier: 0.90 }
      },
      description: "Dyr, men har splash damage og lang rekkevidde."
    },

    lilja: {
      name: "LILJA",
      role: "Kontroll",
      icon: "assets/towers/Lilja.png",
      price: 135,
      range: 130,
      damage: 12,
      cooldown: 42,
      bulletSpeed: 8,
      bulletSize: 5,
      color: "#06b6d4",
      projectile: "pulse",
      projectileIcon: "assets/projectiles/pulse.svg",
      hitEffect: "emp",
      pierce: 2,
      splash: true,
      splashRadius: 30,
      slowEffect: 120,
      slowMultiplier: 0.45,
      ability: {
        name: "67",
        icon: "assets/abilities/emp.svg",
        type: "emp",
        cooldown: 780,
        radius: 250,
        damage: 55,
        slowEffect: 260,
        slowMultiplier: 0.22,
        description: "Senker alle fiender i en stor sirkel."
      },
      upgrades: {
        damage: { maxLevel: 6, costBase: 60, costGrowth: 1.55, valueGrowth: 1.10 },
        range: { maxLevel: 3, costBase: 70, costGrowth: 1.62, valueGrowth: 1.10 },
        speed: { maxLevel: 6, costBase: 85, costGrowth: 1.70, cooldownMultiplier: 0.88 }
      },
      description: "Lav skade, men senker fiender og gir andre tårn tid."
    },

    hakon: {
      name: "Håkon",
      role: "Sniper",
      icon: "assets/towers/Håkon.png",
      price: 310,
      range: 200,
      damage: 135,
      cooldown: 105,
      bulletSpeed: 15,
      bulletSize: 6,
      color: "#a78bfa",
      projectile: "laser",
      projectileIcon: "assets/projectiles/laser.svg",
      hitEffect: "pierce",
      pierce: 2,
      armorPierce: 18,
      ability: {
        name: "Airstrike",
        icon: "assets/abilities/airstrike.svg",
        type: "airstrike",
        cooldown: 1100,
        damage: 420,
        armorPierce: 40,
        maxTargets: 12,
        description: "Presis luftangrep mot de fiendene som har kommet lengst."
      },
      upgrades: {
        damage: { maxLevel: 6, costBase: 145, costGrowth: 1.90, valueGrowth: 1.24 },
        range: { maxLevel: 4, costBase: 110, costGrowth: 1.72, valueGrowth: 1.11 },
        speed: { maxLevel: 5, costBase: 150, costGrowth: 1.92, cooldownMultiplier: 0.91 }
      },
      description: "Treig, presis og sterk mot armored og boss-fiender."
    },

    bergh: {
      name: "Bergh og Erna",
      role: "Hemmelig",
      icon: "assets/towers/Bergh.png",
      unlockCost: 2500,
      price: 900,
      range: 200,
      damage: 200,
      cooldown: 50,
      bulletSpeed: 10,
      bulletSize: 9,
      color: "#ef4444",
      projectile: "laser",
      projectileIcon: "assets/projectiles/laser.svg",
      hitEffect: "explosion",
      pierce: 4,
      splash: true,
      splashRadius: 95,
      armorPierce: 35,
      critChance: 0.18,
      critMultiplier: 2.5,
      ability: {
        name: "Atombombe",
        icon: "assets/abilities/board-bomb.svg",
        type: "boardBomb",
        effectIcon: "assets/effects/atom-bomb.svg",
        cooldown: 2500,
        damage: 700,
        armorPierce: 80,
        description: "Bomber hele brettet og treffer alle fiender."
      },
      upgrades: {
        damage: { maxLevel: 5, costBase: 260, costGrowth: 3.05, valueGrowth: 1.14 },
        range: { maxLevel: 3, costBase: 210, costGrowth: 2.90, valueGrowth: 1.07 },
        speed: { maxLevel: 3, costBase: 280, costGrowth: 3.10, cooldownMultiplier: 0.93 }
      },
      description: "Hemmelig supertårn. Ekstrem skade, splash, pierce og en ability som bomber hele brettet."
    }
  },

  enemies: {
    drone: {
      name: "Drone",
      icon: "assets/enemies/drone.svg",
      hp: 70,
      speed: 2.10,
      reward: 10,
      damage: 2,
      size: 30,
      color: "#38bdf8"
    },

    swarm: {
      name: "Swarm",
      icon: "assets/enemies/drone.svg",
      hp: 40,
      speed: 2.15,
      reward: 6,
      damage: 1,
      size: 24,
      color: "#facc15"
    },

    missile: {
      name: "Missile",
      icon: "assets/enemies/missile.svg",
      hp: 200,
      speed: 2.5,
      reward: 18,
      damage: 4,
      size: 36,
      color: "#fb7185",
      children: { type: "swarm", count: 2 }
    },

    fighter: {
      name: "Fighter",
      icon: "assets/enemies/fighter.svg",
      hp: 600,
      speed: 2.40,
      reward: 23,
      damage: 5,
      size: 40,
      color: "#c084fc",
      children: { type: "drone", count: 4 }
    },

    eliteFighter: {
      name: "Elite Fighter",
      icon: "assets/enemies/fighter.svg",
      hp: 1000,
      speed: 1.45,
      reward: 60,
      damage: 10,
      size: 58,
      color: "#f0abfc",
      armor: 12,
      children: { type: "fighter", count: 2 }
    },

    armored: {
      name: "Armored",
      icon: "assets/enemies/missile.svg",
      hp: 500,
      speed: 1.15,
      reward: 37,
      damage: 5,
      size: 46,
      color: "#94a3b8",
      armor: 16,
      children: { type: "missile", count: 2 }
    },

    regenerator: {
      name: "Regenerator",
      icon: "assets/enemies/drone.svg",
      hp: 400,
      speed: 1.75,
      reward: 34,
      damage: 5,
      size: 42,
      color: "#4ade80",
      regen: 0.23,
      children: { type: "swarm", count: 4 }
    },

    boss: {
      name: "Simonsen",
      icon: "assets/enemies/Simonsen.png",
      hp: 5000,
      speed: 1.3,
      reward: 160,
      damage: 20,
      size: 90,
      color: "#f97316",
      armor: 30,
      children: { type: "fighter", count: 4 }
    }
  },

  upgrades: {
    damage: {
      label: "Skade",
      costBase: 70,
      costGrowth: 1.72,
      valueGrowth: 1.15,
      maxLevel: 5
    },

    range: {
      label: "Rekkevidde",
      costBase: 60,
      costGrowth: 1.62,
      valueGrowth: 1.17,
      maxLevel: 5
    },

    speed: {
      label: "Skuddfart",
      costBase: 80,
      costGrowth: 1.75,
      cooldownMultiplier: 0.70,
      maxLevel: 5
    }
  },

  waves: [
    { name: "Wave 1", groups: [{ type: "drone", count: 12, gap: 42 }] },
    { name: "Wave 2", groups: [{ type: "swarm", count: 18, gap: 28 }, { type: "drone", count: 8, gap: 38 }] },
    { name: "Wave 3", groups: [{ type: "drone", count: 24, gap: 28 }] },
    { name: "Wave 4", groups: [{ type: "swarm", count: 32, gap: 20 }, { type: "drone", count: 10, gap: 30 }] },
    { name: "Wave 5", groups: [{ type: "missile", count: 8, gap: 48 }, { type: "drone", count: 16, gap: 26 }] },
    { name: "Wave 6", groups: [{ type: "swarm", count: 30, gap: 18 }, { type: "missile", count: 10, gap: 42 }] },
    { name: "Wave 7", groups: [{ type: "fighter", count: 5, gap: 62 }, { type: "drone", count: 24, gap: 24 }] },
    { name: "Wave 8", groups: [{ type: "missile", count: 18, gap: 34 }, { type: "swarm", count: 24, gap: 16 }] },
    { name: "Wave 9", groups: [{ type: "armored", count: 5, gap: 78 }, { type: "drone", count: 24, gap: 22 }] },
    { name: "Wave 10", groups: [{ type: "fighter", count: 8, gap: 48 }, { type: "missile", count: 14, gap: 32 }, { type: "swarm", count: 28, gap: 14 }] },
    { name: "Wave 11", groups: [{ type: "regenerator", count: 5, gap: 70 }, { type: "swarm", count: 36, gap: 14 }] },
    { name: "Wave 12", groups: [{ type: "fighter", count: 12, gap: 40 }, { type: "drone", count: 28, gap: 20 }] },
    { name: "Wave 13", groups: [{ type: "armored", count: 9, gap: 56 }, { type: "missile", count: 16, gap: 28 }] },
    { name: "Wave 14", groups: [{ type: "swarm", count: 58, gap: 10 }, { type: "fighter", count: 8, gap: 36 }] },
    { name: "Wave 15", groups: [{ type: "eliteFighter", count: 1, gap: 120 }, { type: "fighter", count: 12, gap: 34 }, { type: "missile", count: 18, gap: 24 }] },
    { name: "Wave 16", groups: [{ type: "regenerator", count: 9, gap: 48 }, { type: "armored", count: 8, gap: 54 }] },
    { name: "Wave 17", groups: [{ type: "fighter", count: 18, gap: 28 }, { type: "swarm", count: 44, gap: 11 }] },
    { name: "Wave 18", groups: [{ type: "armored", count: 11, gap: 46 }, { type: "missile", count: 24, gap: 22 }, { type: "regenerator", count: 6, gap: 42 }] },
    { name: "Wave 19", groups: [{ type: "eliteFighter", count: 3, gap: 92 }, { type: "fighter", count: 16, gap: 26 }] },
    { name: "Wave 20", groups: [{ type: "boss", count: 1, gap: 160 }, { type: "missile", count: 26, gap: 20 }, { type: "swarm", count: 44, gap: 10 }] },
    { name: "Wave 21", groups: [{ type: "drone", count: 48, gap: 14 }, { type: "fighter", count: 18, gap: 24 }, { type: "regenerator", count: 8, gap: 38 }] },
    { name: "Wave 22", groups: [{ type: "armored", count: 14, gap: 38 }, { type: "eliteFighter", count: 2, gap: 78 }] },
    { name: "Wave 23", groups: [{ type: "regenerator", count: 14, gap: 34 }, { type: "swarm", count: 72, gap: 8 }] },
    { name: "Wave 24", groups: [{ type: "eliteFighter", count: 5, gap: 72 }, { type: "fighter", count: 22, gap: 22 }, { type: "missile", count: 18, gap: 20 }] },
    { name: "Wave 25", groups: [{ type: "boss", count: 2, gap: 180 }, { type: "armored", count: 12, gap: 34 }, { type: "fighter", count: 20, gap: 20 }] },
    { name: "Wave 26", groups: [{ type: "swarm", count: 96, gap: 7 }, { type: "missile", count: 34, gap: 16 }] },
    { name: "Wave 27", groups: [{ type: "armored", count: 18, gap: 30 }, { type: "regenerator", count: 14, gap: 30 }] },
    { name: "Wave 28", groups: [{ type: "eliteFighter", count: 8, gap: 58 }, { type: "fighter", count: 26, gap: 18 }] },
    { name: "Wave 29", groups: [{ type: "missile", count: 54, gap: 12 }, { type: "eliteFighter", count: 4, gap: 52 }] },
    { name: "Wave 30", groups: [{ type: "boss", count: 2, gap: 150 }, { type: "eliteFighter", count: 6, gap: 58 }, { type: "regenerator", count: 14, gap: 26 }] },
    { name: "Wave 31", groups: [{ type: "swarm", count: 130, gap: 5 }, { type: "fighter", count: 30, gap: 16 }] },
    { name: "Wave 32", groups: [{ type: "eliteFighter", count: 10, gap: 48 }, { type: "armored", count: 18, gap: 28 }, { type: "missile", count: 28, gap: 14 }] },
    { name: "Wave 33", groups: [{ type: "regenerator", count: 24, gap: 22 }, { type: "armored", count: 20, gap: 24 }] },
    { name: "Wave 34", groups: [{ type: "eliteFighter", count: 14, gap: 40 }, { type: "fighter", count: 36, gap: 14 }] },
    { name: "Wave 35", groups: [{ type: "boss", count: 3, gap: 145 }, { type: "eliteFighter", count: 8, gap: 42 }, { type: "swarm", count: 80, gap: 6 }] },
    { name: "Wave 36", groups: [{ type: "missile", count: 70, gap: 9 }, { type: "regenerator", count: 22, gap: 20 }] },
    { name: "Wave 37", groups: [{ type: "armored", count: 32, gap: 18 }, { type: "eliteFighter", count: 16, gap: 34 }] },
    { name: "Wave 38", groups: [{ type: "fighter", count: 56, gap: 10 }, { type: "eliteFighter", count: 18, gap: 30 }, { type: "swarm", count: 90, gap: 5 }] },
    { name: "Wave 39", groups: [{ type: "boss", count: 4, gap: 120 }, { type: "eliteFighter", count: 18, gap: 28 }, { type: "regenerator", count: 26, gap: 18 }] },
    { name: "Wave 40", groups: [{ type: "boss", count: 6, gap: 100 }, { type: "eliteFighter", count: 24, gap: 24 }, { type: "armored", count: 34, gap: 16 }, { type: "swarm", count: 120, gap: 4 }] }
  ]
};
