// structures.js
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
          let parts = cell.split(".")
          let block = parts[0]
          let type = parts[1] || "p"
          parsedRow.push({ block, type })
        }

        grid.push(parsedRow)
      }

      this.structures[name] = grid
      console.log("STRUCTURES: loaded structure:", name)
    } catch (err) {
      console.error("STRUCTURES: fout bij laden", name, err)
    }
  }

  // laad **alle structures** uit een lijst
  async loadAll() {
    console.log("STRUCTURES: loadAll gestart")
    let list = ["tree", "house", "plank.spawnzombie"] // plank.spawnzombie toegevoegd

    for (let s of list) {
      await this.loadStructure(s)
    }

    console.log("STRUCTURES: loadAll klaar, structures:", Object.keys(this.structures))
  }

  // **hot reload** functie
  async reloadAll() {
    console.log("STRUCTURES: reloadAll gestart")
    this.structures = {}
    await this.loadAll()
    console.log("STRUCTURES: reloadAll klaar")
  }

  // kies een random structure
  getRandom() {
    let keys = Object.keys(this.structures)
    if (keys.length === 0) {
      console.warn("STRUCTURES: geen structures beschikbaar")
      return null
    }
    return this.structures[keys[Math.floor(Math.random() * keys.length)]]
  }

  // kies een specifieke structure
  get(name) {
    if (!this.structures[name]) {
      console.warn("STRUCTURES: get() niet gevonden", name)
      return null
    }
    return this.structures[name]
  }

  // ====== SPECIAL SPAWN FUNCTIES ======
  // spawn een plank met zombie op x,y
  spawnPlankZombie(world, wx, wy) {
    const structure = this.get("plank.spawnzombie")
    if (!structure) {
      console.warn("STRUCTURES: plank.spawnzombie niet geladen")
      return null
    }

    let width = structure[0].length
    let height = structure.length

    // zet structure in world
    world.placeStructure(structure, wx, wy)

    // vind een plank-tile binnen de structure (bijvoorbeeld type "p")
    let plankTile = null
    for (let sy = 0; sy < height; sy++) {
      for (let sx = 0; sx < width; sx++) {
        const cell = structure[sy][sx]
        if (cell.block === "plank") {
          plankTile = { x: wx + sx, y: wy + sy }
          break
        }
      }
      if (plankTile) break
    }

    if (!plankTile) {
      console.warn("STRUCTURES: geen plank tile gevonden voor zombie spawn")
      return null
    }

    // spawn zombie op die plank
    const enemy = window.enemies.spawn("zombie", plankTile.x * world.tileSize + world.tileSize/2, plankTile.y * world.tileSize + world.tileSize/2)

    console.log("STRUCTURES: plank.spawnzombie geplaatst met enemy", enemy)
    return enemy
  }

}
