// structures.js

export const structuresList = [
  // [structureName, spawnChanceInPercent]
  ["tree", 30],     // 30% kans per chunk
  ["house", 10],    // 10% kans
   
]

// StructureManager blijft zoals je had, met FLEXIBELE SPAWN parsing
export class StructureManager {

  constructor(blocks) {
    this.blocks = blocks
    this.structures = {} // { name: grid }
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
          cell = cell.trim()
          let parts = cell.split(".")
          let block = parts[0]
          let type = parts[1] || "p"

          // FLEXIBELE SPAWN PARSING
          if (cell.includes("spawn.")) {
            let entityType = parts[parts.length - 1]  // altijd laatste deel
            parsedRow.push({ spawn: entityType })
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

  // laad **alle structures** uit de lijst
  async loadAll() {
    console.log("STRUCTURES: loadAll gestart")
    for (let [name] of structuresList) {
      await this.loadStructure(name)
    }
    console.log("STRUCTURES: loadAll klaar, structures:", Object.keys(this.structures))
  }

  async reloadAll() {
    console.log("STRUCTURES: reloadAll gestart")
    this.structures = {}
    await this.loadAll()
    console.log("STRUCTURES: reloadAll klaar")
  }

  // kies een random structure op basis van spawnChance
  getRandom() {
    let totalWeight = structuresList.reduce((sum, s) => sum + s[1], 0)
    let rnd = Math.random() * totalWeight
    let accumulated = 0

    for (let [name, chance] of structuresList) {
      accumulated += chance
      if (rnd <= accumulated) {
        return this.structures[name] || null
      }
    }

    return this.structures[structuresList[0][0]] || null
  }

  get(name) {
    if (!this.structures[name]) {
      console.warn("STRUCTURES: get() niet gevonden", name)
      return null
    }
    return this.structures[name]
  }

  handleSpawns(world, worldX, worldY, structure) {
    let h = structure.length
    let w = structure[0].length

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        let cell = structure[sy][sx]

        if (cell && cell.spawn) {
          // spawn enemy op deze positie
          world.spawnEnemy(cell.spawn, worldX + sx, worldY + sy)

          // vervang de tile door een walkable tile zodat enemy niet vastzit
          if (world.getStructureTile(worldX + sx, worldY + sy)) {
            world.getStructureTile(worldX + sx, worldY + sy).block = "planks"
            world.getStructureTile(worldX + sx, worldY + sy).type = "p"
          }
        }
      }
    }
  }
}
