export class World {
  constructor(blocks, textures) {
    console.log("WORLD: constructor gestart")
    this.canvas = canvas

    this.tileSize = 32
    this.blocks = blocks
    this.textures = textures
    this.chunkSize = 32
    this.chunks = {}
    this.structures = []

    // spawn table: structure => kans per chunk
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
  }

  checkOverlap(x, y, w, h) {
    for (let s of this.structures) {
      if (x < s.x + s.w &&
          x + w > s.x &&
          y < s.y + s.h &&
          y + h > s.y) {
        return true
      }
    }
    return false
  }

  placeStructure(structure, x, y) {
    let w = structure[0].length
    let h = structure.length

    // loop door alle tiles en zet chest-luck indien LTxx
    let grid = structure.map(row => row.slice())
    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        let cell = grid[sy][sx]
        if (typeof cell === "string" && cell.startsWith("LT")) {
          let luck = parseInt(cell.substring(2)) || 1
          grid[sy][sx] = { block: "chest", type: "c", luck }
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
        return s.grid[sy][sx]
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

    let tile = chunk[ty][tx]
    if (!tile) console.error("WORLD: base tile bestaat niet", wx, wy)

    return tile
  }

  getTile(wx, wy) {
    let structureTile = this.getStructureTile(wx, wy)
    return structureTile || this.getBaseTile(wx, wy)
  }

  isWalkable(wx, wy) {
    let tile = this.getTile(wx, wy)
    if (!tile) {
      console.error("WORLD: walkable check tile ontbreekt", wx, wy)
      return true
    }
    return tile.type !== "w"
  }

  draw(ctx, camera) {
    let startX = Math.floor(camera.x / this.tileSize) - 2
    let startY = Math.floor(camera.y / this.tileSize) - 2
    let endX = startX + Math.ceil(this.canvas.width / this.tileSize) + 4
    let endY = startY + Math.ceil(this.canvas.height / this.tileSize) + 4

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let base = this.getBaseTile(x, y)
        let block = this.blocks[base.block]
        if (!block) console.warn("WORLD: base block niet gevonden", base.block)
        let tex = this.textures[block.texture]
        if (!tex) console.warn("WORLD: texture niet gevonden", block.texture)
        ctx.drawImage(tex, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize)
      }
    }

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let structureTile = this.getStructureTile(x, y)
        if (!structureTile) continue
        let block = this.blocks[structureTile.block]
        if (!block) console.warn("WORLD: structure block niet gevonden", structureTile.block)
        let tex = this.textures[block.texture]
        if (!tex) console.warn("WORLD: structure texture niet gevonden", block.texture)
        ctx.drawImage(tex, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize)
      }
    }
  }
}
