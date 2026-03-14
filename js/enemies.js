// enemies.js
import { makeTransparent } from "./textureUtils.js";

// ===== Enemy Class =====
export class Enemy {
  constructor(type, x, y, data, texture, weaponTexture, world) {
    this.type = type
    this.x = x
    this.y = y

    this.hp = data.hp
    this.maxHp = data.hp
    this.speed = data.speed
    this.damage = data.damage
    this.range = data.range || { length: 1 }

    this.texture = texture
    this.weaponTexture = weaponTexture
    this.weapon = data.weapon || null

    this.dead = false
    this.attackCooldown = 0
    this.attackTime = 1000 // ms

    this.world = world
    this.path = []
    this.tileSize = 32
  }

  update(player, deltaTime) {
    if (this.dead) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.hypot(dx, dy)
    const attackRange = this.range.length * this.tileSize

    if (dist > attackRange) {
      const startTile = this.toTile(this.x, this.y)
      const endTile = this.toTile(player.x, player.y)

      if (
        this.path.length === 0 ||
        this.path[this.path.length - 1][0] !== endTile[0] ||
        this.path[this.path.length - 1][1] !== endTile[1]
      ) {
        this.path = this.findPath(startTile, endTile)
      }

      this.followPath(deltaTime)
    } else {
      this.tryAttack(player)
      this.path = []
    }

    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime
  }

  toTile(x, y) {
    return [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)]
  }

  toPixel(tile) {
    return [tile[0] * this.tileSize + this.tileSize / 2, tile[1] * this.tileSize + this.tileSize / 2]
  }

  followPath(deltaTime) {
    if (this.path.length === 0) return
    const [tx, ty] = this.path[0]
    const [px, py] = this.toPixel([tx, ty])
    const dx = px - this.x
    const dy = py - this.y
    const dist = Math.hypot(dx, dy)
    if (dist < 0.1) {
      this.path.shift()
      return
    }
    // pixel movement met deltaTime
    this.x += (dx / dist) * this.speed * deltaTime
    this.y += (dy / dist) * this.speed * deltaTime
  }

  tryAttack(player) {
    if (this.attackCooldown > 0) return

    const dx = player.x - this.x
    const dy = player.y - this.y
    const dist = Math.hypot(dx, dy)

    if (dist <= this.range.length * this.tileSize) {
      player.hp = Math.max(0, (player.hp || 10) - this.damage)
      this.attackCooldown = this.attackTime
      console.log(`[ENEMY] ${this.type} valt speler aan! Damage: ${this.damage}`)
    }
  }

  draw(ctx, camera) {
    if (this.dead) return
    if (this.texture)
      ctx.drawImage(this.texture, this.x - camera.x - 16, this.y - camera.y - 16, 32, 32)
    if (this.weaponTexture)
      ctx.drawImage(this.weaponTexture, this.x - camera.x + 10, this.y - camera.y - 8, 16, 16)
  }

  findPath(start, end) {
    // eenvoudige A* pathfinding
    const openSet = []
    const closedSet = new Set()
    const cameFrom = {}
    const key = (t) => `${t[0]},${t[1]}`
    const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])

    openSet.push({ tile: start, g: 0, f: heuristic(start, end) })

    while (openSet.length) {
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()
      const [cx, cy] = current.tile

      if (cx === end[0] && cy === end[1]) {
        const path = []
        let c = key(end)
        while (c !== key(start)) {
          const t = cameFrom[c]
          path.unshift(t)
          c = key(t)
        }
        return path
      }

      closedSet.add(key(current.tile))

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ]

      for (let n of neighbors) {
        const [nx, ny] = n
        if (!this.world.isWalkable(nx, ny)) continue
        if (closedSet.has(key(n))) continue

        const gScore = current.g + 1
        const fScore = gScore + heuristic(n, end)
        const existing = openSet.find((o) => o.tile[0] === nx && o.tile[1] === ny)
        if (existing) {
          if (gScore < existing.g) {
            existing.g = gScore
            existing.f = fScore
            cameFrom[key(n)] = current.tile
          }
        } else {
          openSet.push({ tile: n, g: gScore, f: fScore })
          cameFrom[key(n)] = current.tile
        }
      }
    }

    return []
  }
}

// ===== EnemyManager =====
export class EnemyManager {
  constructor(world) {
    this.world = world
    this.enemyTypes = {}
    this.enemyTextures = {}
    this.weaponTextures = {}
    this.enemies = []
  }

  async load() {
    const res = await fetch("data/enemys.json")
    this.enemyTypes = await res.json()

    for (const type in this.enemyTypes) {
      const texName = this.enemyTypes[type].texture
      let img = new Image()
      img.src = "assets/" + texName
      await new Promise((res) => (img.onload = res))
      img = await makeTransparent(img)
      this.enemyTextures[type] = img

      const weapon = this.enemyTypes[type].weapon
      if (weapon) {
        let wImg = new Image()
        wImg.src = "assets/" + weapon + ".png"
        await new Promise((res) => (wImg.onload = res))
        this.weaponTextures[weapon] = await makeTransparent(wImg)
      }
    }

    console.log("[ENEMIES] Loaded:", Object.keys(this.enemyTypes))
  }

  spawn(type, tileX, tileY) {
    const data = this.enemyTypes[type]
    if (!data) return console.error("Unknown enemy type:", type)

    const tex = this.enemyTextures[type]
    const weaponTex = data.weapon ? this.weaponTextures[data.weapon] : null

    const enemy = new Enemy(tileX + 0.5, tileY + 0.5, tileY + 0.5, data, tex, weaponTex, this.world)
    this.enemies.push(enemy)
    return enemy
  }

  update(player, deltaTime) {
    for (const e of this.enemies) e.update(player, deltaTime)
    this.enemies = this.enemies.filter((e) => !e.dead)
  }

  draw(ctx, camera) {
    for (const e of this.enemies) e.draw(ctx, camera)
  }

  spawnRandom(type, attempts = 100) {
    for (let i = 0; i < attempts; i++) {
      const wx = Math.floor(Math.random() * 100)
      const wy = Math.floor(Math.random() * 100)
      if (this.world.isWalkable(wx, wy))
        return this.spawn(type, wx, wy)
    }
    return null
  }
}

// singleton
if (!window.enemies) window.enemies = new EnemyManager(window.world || null)
