// enemies.js
import { makeTransparent } from "./textureUtils.js";
import { itemTextures } from "./main.js";

// ===== Enemy Class =====
export class Enemy {
  constructor(type, x, y, data, texture, weaponTexture, world) {
    this.type = type;
    this.x = x;
    this.y = y;

    this.hp = data.hp;
    this.speed = data.speed;
    this.damage = data.damage;
    this.range = data.range || { length: 1 }; // fallback

    this.texture = texture;
    this.weaponTexture = weaponTexture;

    this.weapon = data.weapon || null;
    this.attackFunction = data.attackfunction || null; // opgeslagen voor later gebruik

    this.dead = false;
    this.attackCooldown = 0;
    this.attackTime = 1000; // 1 sec cooldown

    this.world = world; // reference naar world voor pathfinding
    this.path = []; // tile path naar speler
    this.tileSize = 32;
  }

  update(player, deltaTime) {
    if (this.dead) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const attackRange = this.range.length * this.tileSize;

    // update path als speler buiten attack range
    if (dist > attackRange) {
      const startTile = this.toTile(this.x, this.y);
      const endTile = this.toTile(player.x, player.y);

      if (
        this.path.length === 0 ||
        this.path[this.path.length - 1][0] !== endTile[0] ||
        this.path[this.path.length - 1][1] !== endTile[1]
      ) {
        this.path = this.findPath(startTile, endTile);
      }

      this.followPath(deltaTime);
    } else {
      // aanval
      this.tryAttack(player);
      this.path = [];
    }

    // cooldown afbouwen
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
  }

  toTile(x, y) {
    return [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)];
  }

  toPixel(tile) {
    return [tile[0] * this.tileSize + this.tileSize / 2, tile[1] * this.tileSize + this.tileSize / 2];
  }

  followPath(deltaTime) {
    if (this.path.length === 0) return;
    const [tx, ty] = this.path[0];
    const [px, py] = this.toPixel([tx, ty]);
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      this.path.shift(); // tile bereikt
      return;
    }

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }

  tryAttack(player) {
    if (!this.canAttack()) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= this.range.length * this.tileSize) {
      player.hp = Math.max(0, (player.hp || 10) - this.damage);
      this.resetCooldown();
      console.log(`[ENEMY] ${this.type} valt speler aan! Damage: ${this.damage}`);
      // TODO: gebruik attackFunction als je meerdere aanvalstypes wilt implementeren
    }
  }

  canAttack() {
    return this.attackCooldown <= 0;
  }

  resetCooldown() {
    this.attackCooldown = this.attackTime;
  }

  draw(ctx, camera) {
    if (this.dead) return;

    if (this.texture) {
      ctx.drawImage(this.texture, this.x - camera.x - 16, this.y - camera.y - 16, 32, 32);
    }
    if (this.weaponTexture) {
      ctx.drawImage(this.weaponTexture, this.x - camera.x + 10, this.y - camera.y - 8, 16, 16);
    }
  }

  // ===== A* Pathfinding =====
  findPath(start, end) {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    const key = (t) => t[0] + "," + t[1];
    const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

    openSet.push({ tile: start, g: 0, f: heuristic(start, end) });

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const [cx, cy] = current.tile;

      if (cx === end[0] && cy === end[1]) {
        const path = [];
        let c = key(end);
        while (c !== key(start)) {
          const t = cameFrom[c];
          path.unshift(t);
          c = key(t);
        }
        return path;
      }

      closedSet.add(key(current.tile));

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (let n of neighbors) {
        const [nx, ny] = n;
        if (!this.world.isWalkable(nx, ny)) continue;
        if (closedSet.has(key(n))) continue;
        const gScore = current.g + 1;
        const fScore = gScore + heuristic(n, end);

        const existing = openSet.find((o) => o.tile[0] === nx && o.tile[1] === ny);
        if (existing) {
          if (gScore < existing.g) {
            existing.g = gScore;
            existing.f = fScore;
            cameFrom[key(n)] = current.tile;
          }
        } else {
          openSet.push({ tile: n, g: gScore, f: fScore });
          cameFrom[key(n)] = current.tile;
        }
      }
    }

    return []; // geen pad gevonden
  }
}

// ===== EnemyManager =====
export class EnemyManager {
  constructor(world) {
    this.world = world;
    this.enemyTypes = {};
    this.enemyTextures = {};
    this.enemies = [];
  }

  async load() {
    const r = await fetch("data/enemys.json");
    this.enemyTypes = await r.json();

    for (const type in this.enemyTypes) {
      const texName = this.enemyTypes[type].texture;
      let img = new Image();
      img.src = "assets/" + texName;
      await new Promise((res) => (img.onload = res));
      img = await makeTransparent(img);
      this.enemyTextures[type] = img;
    }

    console.log("[ENEMIES] Loaded:", Object.keys(this.enemyTypes));
  }

  spawn(type, x, y) {
    const data = this.enemyTypes[type];
    if (!data) {
      console.error("[ENEMIES] Type bestaat niet:", type);
      return;
    }

    const tex = this.enemyTextures[type];
    const weaponTex = itemTextures[data.weapon] || null;

    // x, y worden pixel posities
    const enemy = new Enemy(type, x, y, data, tex, weaponTex, this.world);
    this.enemies.push(enemy);
    return enemy;
  }

  update(player, deltaTime) {
    for (const e of this.enemies) e.update(player, deltaTime);
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  draw(ctx, camera) {
    for (const e of this.enemies) e.draw(ctx, camera);
  }

  spawnRandom(type, attempts = 100) {
    for (let i = 0; i < attempts; i++) {
      const wx = Math.floor(Math.random() * 100);
      const wy = Math.floor(Math.random() * 100);
      if (this.world.isWalkable(wx, wy)) return this.spawn(type, wx * 32 + 16, wy * 32 + 16);
    }
    return null;
  }
}

// ===== Singleton =====
if (!window.enemies) {
  window.enemies = new EnemyManager(window.world || null);
}
