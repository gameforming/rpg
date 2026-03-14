export class World {
  constructor(blocks, textures, canvas, enemyManager) {
    console.log("WORLD: constructor gestart")
    this.canvas = canvas

    this.tileSize = 32
    this.blocks = blocks
    this.textures = textures
    this.chunkSize = 32
    this.chunks = {}
    this.structures = []
    this.enemies = []
    this.enemyManager = enemyManager

    this.structureChances = {
      tree: 0.8,
      house: 0.2
    }

    console.log("WORLD: constructor klaar, structuur kansen:", this.structureChances)
  }

  getChunkKey(cx, cy) {
    return cx + "," + cy
  }

  generateChunk(cx, cy) {
    let key = this.getChunkKey(cx, cy)
    console.log("WORLD: chunk genereren", key)

    let chunk = []
    for (let y = 0; y < this.chunkSize; y++) {
      let row = []
      for (let x = 0; x < this.chunkSize; x++) {
        row.push({ block: "grass", type: "p" })
      }
      chunk.push(row)
    }

    this.chunks[key] = chunk
    console.log("WORLD: chunk gemaakt", key)

    this.spawnStructuresInChunk(cx, cy)
  }

  spawnStructuresInChunk(cx, cy) {
    let maxStructures = 3
    let spawned = 0
    let keys = Object.keys(this.structureChances)

    while (spawned < maxStructures) {
      for (let name of keys) {
        let chance = this.structureChances[name]
        if (Math.random() < chance) {
          this.spawnStructure(name, cx, cy)
          spawned++
          if (spawned >= maxStructures) break
        }
      }
      break
    }
  }

  spawnStructure(name, cx, cy) {
    if (!window.structures) {
      console.warn("WORLD: structure manager niet geladen")
      return
    }

    let structure = window.structures.get(name)
    if (!structure) {
      console.warn("WORLD: structure niet gevonden", name)
      return
    }

    let width = structure[0].length
    let height = structure.length

    let posX = Math.floor(Math.random() * (this.chunkSize - width))
    let posY = Math.floor(Math.random() * (this.chunkSize - height))

    let worldX = cx * this.chunkSize + posX
    let worldY = cy * this.chunkSize + posY

    console.log(`WORLD: proberen ${name} te spawnen op`, worldX, worldY)

    if (this.checkOverlap(worldX, worldY, width, height)) {
      console.warn(`WORLD: overlap gedetecteerd voor ${name}, spawn geannuleerd`)
      return
    }

    this.placeStructure(structure, worldX, worldY)

    // FIX: EnemyManager gebruiken voor spawn tiles
    if (window.structures && window.structures.handleSpawns) {
      window.structures.handleSpawns(this.enemyManager, worldX, worldY, structure)
    }
  }

  checkOverlap(x, y, w, h) {
    for (let s of this.structures) {
      if (
        x < s.x + s.w &&
        x + w > s.x &&
        y < s.y + s.h &&
        y + h > s.y
      ) {
        return true
      }
    }
    return false
  }

  placeStructure(structure, x, y) {
    let w = structure[0].length
    let h = structure.length

    let grid = structure.map(row => row.slice())

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        let cell = grid[sy][sx]

        if (typeof cell === "string") {

          // chest luck tiles
          if (cell.startsWith("LT")) {
            let luck = parseInt(cell.substring(2)) || 1
            grid[sy][sx] = { block: "chest", type: "c", luck }
            continue
          }

          // parsing spawn tiles
          let parts = cell.split(".")

          if (parts.includes("spawn")) {
            let spawnIndex = parts.indexOf("spawn")
            let block = parts[0] || "planks"
            let enemy = parts[spawnIndex + 1] || "zombie"
            let type = parts[spawnIndex + 2] || "p"

            grid[sy][sx] = {
              block: block,
              type: type,
              spawn: enemy
            }
            continue
          }

          // normale tiles
          if (parts.length >= 2) {
            grid[sy][sx] = {
              block: parts[0],
              type: parts[1]
            }
          }
        }
      }
    }

    this.structures.push({ x, y, w, h, grid })
    console.log("WORLD: structure geplaatst", structure, "op", x, y)
  }

  getStructureTile(wx, wy) {
    for (let s of this.structures) {
      let sx = wx - s.x
      let sy = wy - s.y
      if (sx >= 0 && sy >= 0 && sx < s.w && sy < s.h) {
        let tile = s.grid[sy][sx]
        if (tile.spawn) return null // spawn tiles niet zichtbaar
        return tile
      }
    }
    return null
  }

  getBaseTile(wx, wy) {
    let cx = Math.floor(wx / this.chunkSize)
    let cy = Math.floor(wy / this.chunkSize)
    let key = this.getChunkKey(cx, cy)

    if (!this.chunks[key]) {
      console.log("WORLD: chunk bestaat niet, genereren", key)
      this.generateChunk(cx, cy)
    }

    let chunk = this.chunks[key]
    let tx = ((wx % this.chunkSize) + this.chunkSize) % this.chunkSize
    let ty = ((wy % this.chunkSize) + this.chunkSize) % this.chunkSize

    return chunk[ty][tx]
  }

  getTile(wx, wy) {
    return this.getStructureTile(wx, wy) || this.getBaseTile(wx, wy)
  }

  isWalkable(wx, wy) {
    let tile = this.getTile(wx, wy)
    if (!tile) return true
    return tile.type !== "w"
  }

  spawnEnemy(type = "zombie", x = null, y = null) {
    if (this.enemyManager) {
      return this.enemyManager.spawn(type, x, y)
    }

    let posX = x
    let posY = y
    let tries = 0

    if (posX === null || posY === null) {
      do {
        let chunkX = Math.floor(Math.random() * 10)
        let chunkY = Math.floor(Math.random() * 10)
        posX = Math.floor(Math.random() * this.chunkSize) + chunkX * this.chunkSize
        posY = Math.floor(Math.random() * this.chunkSize) + chunkY * this.chunkSize
        tries++
        if (tries > 100) return null
      } while (!this.isWalkable(posX, posY))
    }

    const enemy = {
      id: crypto.randomUUID(),
      type: type,
      x: posX + 0.5,
      y: posY + 0.5,
      hp: 20,
      dead: false
    }

    this.enemies.push(enemy)
    return enemy
  }

  draw(ctx, camera) {
    let startX = Math.floor(camera.x / this.tileSize) - 2
    let startY = Math.floor(camera.y / this.tileSize) - 2
    let endX = startX + Math.ceil(this.canvas.width / this.tileSize) + 4
    let endY = startY + Math.ceil(this.canvas.height / this.tileSize) + 4

    // base tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let base = this.getBaseTile(x, y)
        let block = this.blocks[base.block]
        let tex = this.textures[block.texture]
        ctx.drawImage(tex, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize)
      }
    }

    // structures
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let st = this.getStructureTile(x, y)
        if (!st) continue
        let block = this.blocks[st.block]
        let tex = this.textures[block.texture]
        ctx.drawImage(tex, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize)
      }
    }

    // world-enemies
    for (let enemy of this.enemies) {
      if (enemy.dead) continue
      ctx.fillStyle = "green"
      ctx.fillRect(
        enemy.x * this.tileSize - camera.x - this.tileSize / 2,
        enemy.y * this.tileSize - camera.y - this.tileSize / 2,
        this.tileSize,
        this.tileSize
      )
    }

    // EnemyManager-enemies
    if (this.enemyManager) {
      for (let enemy of this.enemyManager.enemies) {
        if (enemy.dead) continue
        if (enemy.draw) enemy.draw(ctx, camera)
        else {
          ctx.fillStyle = "red"
          ctx.fillRect(
            enemy.x * this.tileSize - camera.x - this.tileSize / 2,
            enemy.y * this.tileSize - camera.y - this.tileSize / 2,
            this.tileSize,
            this.tileSize
          )
        }
      }
    }
  }
}
