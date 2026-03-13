// structures.js
export class StructureManager {

  constructor(blocks) {
    this.blocks = blocks
    this.structures = {} // { name: grid }

    // ✅ lijst van structures met spawnkansen (per chunk)
    this.structureChances = {
      tree: 0.8,
      house: 0.2
    }
  }

  // laad een enkele structure uit structures/<name>.txt
  async loadStructure(name) {
    try {
      console.log("STRUCTURES: loading structure:", name)
      let res = await fetch("structures/" + name + ".txt?cache=" + Date.now()) // cache-bust
      if (!res.ok) {
        console.error("STRUCTURES: file niet gevonden:", name)
        return
      }

      let text = await res.text()
      let rows = text.trim().split("\n")
      let grid = []

      for (let row of rows) {
        let cols = row.split(",")
        let parsedRow = []

        for (let cell of cols) {
          let parts = cell.split(".")
          let block = parts[0]
          let type = parts[1] || "p"

          // special spawn tile
          if (block.startsWith("spawn")) {
            parsedRow.push({ spawn: block.split(".")[1] }) // bv spawn.zombie -> {spawn:"zombie"}
          } else {
            parsedRow.push({ block, type })
          }
        }

        grid.push(parsedRow)
      }

      this.structures[name] = grid
      console.log("STRUCTURES: loaded structure:", name)
    } catch (err) {
      console.error("STRUCTURES: fout bij laden", name, err)
    }
  }

  // laad **alle structures** uit de lijst (tree en house)
  async loadAll() {
    console.log("STRUCTURES: loadAll gestart")
    let list = ["tree", "house"]

    for (let s of list) {
      await this.loadStructure(s)
    }

    console.log("STRUCTURES: loadAll klaar, structures:", Object.keys(this.structures))
  }

  async reloadAll() {
    console.log("STRUCTURES: reloadAll gestart")
    this.structures = {}
    await this.loadAll()
    console.log("STRUCTURES: reloadAll klaar")
  }

  getRandom() {
    let keys = Object.keys(this.structures)
    if (keys.length === 0) {
      console.warn("STRUCTURES: geen structures beschikbaar")
      return null
    }
    return this.structures[keys[Math.floor(Math.random() * keys.length)]]
  }

  get(name) {
    if (!this.structures[name]) {
      console.warn("STRUCTURES: get() niet gevonden", name)
      return null
    }
    return this.structures[name]
  }

  // ======== SPECIAL SPAWN HANDLER ========
  // wordt vanuit World.spawnStructure aangeroepen
  handleSpawns(enemyManager, worldX, worldY, structure) {
    let h = structure.length
    let w = structure[0].length

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        let cell = structure[sy][sx]

        if (cell && cell.spawn) {
          // Zorg dat plank aanwezig is op de spawn tile
          const worldTile = enemyManager.world.getStructureTile(worldX + sx, worldY + sy)
          if (worldTile) {
            worldTile.block = "planks"
            worldTile.type = "p"
          }

          // spawn de enemy via EnemyManager
          enemyManager.spawn(cell.spawn, (worldX + sx) * 32, (worldY + sy) * 32)
        }
      }
    }
  }
}
