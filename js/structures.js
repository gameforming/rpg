// structures.js
export class StructureManager {
  constructor() {
    this.list = {};        // naam -> grid
    this.metadata = {};    // naam -> {chance, rare}
  }

  // Voeg structuur toe aan de lijst (metadata kan default zijn)
  add(name, grid, options={}) {
    this.list[name] = grid;
    this.metadata[name] = {
      chance: options.chance !== undefined ? options.chance : 0.2,
      rare: options.rare !== undefined ? options.rare : false
    };
  }

  // Haal structuur op
  get(name) {
    return this.list[name] || null;
  }

  // Laad alle txt files uit structures/ map
  async loadAll(files) {
    for (let file of files) {
      const name = file.replace(".txt","");
      try {
        const res = await fetch("structures/" + file);
        if (!res.ok) {
          console.warn("STRUCTURES: file niet gevonden:", file);
          continue;
        }
        const text = await res.text();
        const grid = text.split("\n").map(line => line.split(","));
        this.add(name, grid); // default chance 0.2
        console.log("STRUCTURES: geladen", name);
      } catch(e) {
        console.warn("STRUCTURES: fout bij laden", file, e);
      }
    }
  }

  // Plaats structuur in wereld
  placeStructure(world, structure, x, y) {
    const w = structure[0].length;
    const h = structure.length;
    const grid = structure.map(row => row.slice());

    // Speciale tiles verwerken
    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        const cell = grid[sy][sx];
        if (typeof cell === "string") {
          if (cell.startsWith("LT")) {
            grid[sy][sx] = { block: "chest", type: "c", luck: parseInt(cell.substring(2)) || 1 };
          } else if (cell.startsWith("spawn.")) {
            grid[sy][sx] = { spawn: cell.substring(6) };
          }
        }
      }
    }

    world.structures.push({ x, y, w, h, grid });
  }

  // Check overlap
  checkOverlap(structuresList, x, y, w, h) {
    for (let s of structuresList) {
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return true;
    }
    return false;
  }

  // Spawn enemies automatisch
  handleSpawns(enemyManager, wx, wy, structure) {
    for (let y = 0; y < structure.length; y++) {
      for (let x = 0; x < structure[y].length; x++) {
        const cell = structure[y][x];
        if (typeof cell === "object" && cell.spawn) {
          const type = cell.spawn;
          enemyManager.spawn(type, wx + x, wy + y);
        }
      }
    }
  }

  // Kies random structuur op basis van chance
  getRandomStructure() {
    const names = Object.keys(this.list);
    const filtered = names.filter(name => Math.random() < (this.metadata[name]?.chance || 0.2));
    if (filtered.length === 0) return null;
    return this.list[filtered[Math.floor(Math.random() * filtered.length)]];
  }

  // Spawn meerdere structuren in chunk
  spawnStructuresInChunk(world, cx, cy, maxStructures=3) {
    let spawned = 0;
    while (spawned < maxStructures) {
      const structure = this.getRandomStructure();
      if (!structure) break;

      const w = structure[0].length;
      const h = structure.length;

      const wx = cx * world.chunkSize + Math.floor(Math.random() * (world.chunkSize - w));
      const wy = cy * world.chunkSize + Math.floor(Math.random() * (world.chunkSize - h));

      if (this.checkOverlap(world.structures, wx, wy, w, h)) continue;

      this.placeStructure(world, structure, wx, wy);

      if (world.enemyManager) this.handleSpawns(world.enemyManager, wx, wy, structure);

      spawned++;
    }
  }
}
