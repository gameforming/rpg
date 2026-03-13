// structures.js
export class StructureManager {
  constructor() {
    this.structures = {};       // naam -> grid array
    this.metadata = {};         // naam -> {chance, rare}
  }

  // Voeg structuur toe
  add(name, grid, options = {}) {
    this.structures[name] = grid;
    this.metadata[name] = {
      chance: options.chance !== undefined ? options.chance : 0.2,
      rare: options.rare !== undefined ? options.rare : false
    };
  }

  // Haal structuur op
  get(name) {
    return this.structures[name] || null;
  }

  // Laad alle txt files uit de map
  async loadAll(files) {
    for (const file of files) {
      const name = file.replace(".txt","");
      try {
        const res = await fetch(`structures/${file}`);
        if (!res.ok) {
          console.warn("STRUCTURES: file niet gevonden:", file);
          continue;
        }
        const text = await res.text();
        const grid = text.split("\n").map(line => line.split(","));
        this.add(name, grid);
        console.log("STRUCTURES: geladen", name);
      } catch(e) {
        console.error("STRUCTURES: fout bij laden", file, e);
      }
    }
  }

  // Plaats structuur in wereld
  placeStructure(world, structure, wx, wy) {
    const w = structure[0].length;
    const h = structure.length;
    const grid = structure.map(row => row.slice());

    for (let sy = 0; sy < h; sy++) {
      for (let sx = 0; sx < w; sx++) {
        const cell = grid[sy][sx];
        if (typeof cell === "string") {
          // chest
          if (cell.startsWith("LT")) {
            grid[sy][sx] = { block: "chest", type: "c", luck: parseInt(cell.substring(2)) || 1 };
          }
          // spawn
          else if (cell.startsWith("spawn.")) {
            grid[sy][sx] = { spawn: cell.substring(6).replace(".p","") };
          }
        }
      }
    }

    world.structures.push({ x: wx, y: wy, w, h, grid });
  }

  // Check overlap
  checkOverlap(structuresList, x, y, w, h) {
    for (const s of structuresList) {
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return true;
    }
    return false;
  }

  // Spawn enemies in structure
  handleSpawns(enemyManager, wx, wy, structure) {
    for (let sy = 0; sy < structure.length; sy++) {
      for (let sx = 0; sx < structure[sy].length; sx++) {
        const cell = structure[sy][sx];
        if (typeof cell === "object" && cell.spawn) {
          const type = cell.spawn;
          enemyManager.spawn(type, wx + sx, wy + sy);
        }
      }
    }
  }

  // Kies random structuur op basis van chance
  getRandomStructure() {
    const names = Object.keys(this.structures);
    const filtered = names.filter(name => Math.random() < (this.metadata[name]?.chance || 0.2));
    if (filtered.length === 0) return null;
    return this.structures[filtered[Math.floor(Math.random() * filtered.length)]];
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

  // Optioneel: lijst van alle structuren + kans voor debug / configuratie
  getStructureList() {
    return Object.keys(this.structures).map(name => ({
      name,
      chance: this.metadata[name]?.chance || 0.2,
      rare: this.metadata[name]?.rare || false
    }));
  }
}
