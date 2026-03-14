// structures.js
export class StructureManager {

  constructor() {
    this.structures = {};
    this.metadata = {};
  }

  // -------------------------
  // Structuur toevoegen
  // -------------------------
  add(name, grid, options = {}) {

    this.structures[name] = grid;

    this.metadata[name] = {
      chance: options.chance ?? 0.2,
      rare: options.rare ?? false
    };

  }

  get(name) {
    return this.structures[name] || null;
  }

  // -------------------------
  // TXT files laden
  // -------------------------
  async loadAll(files) {

    for (const file of files) {

      const name = file.replace(".txt", "");

      try {

        const res = await fetch(`structures/${file}`);

        if (!res.ok) {
          console.warn("STRUCTURES: file niet gevonden:", file);
          continue;
        }

        const text = await res.text();

        const grid = text
          .trim()
          .split("\n")
          .map(line => line.split(",").map(v => v.trim()));

        this.add(name, grid);

        console.log("STRUCTURE LOADED:", name);

      } catch (e) {

        console.error("STRUCTURE LOAD ERROR:", file, e);

      }

    }

  }

  // -------------------------
  // CELL PARSER
  // -------------------------
  parseCell(cell) {

    if (typeof cell !== "string") return cell;

    const parts = cell.split(".");

    let block = null;
    let spawn = null;
    let pathfinding = false;
    let chestLuck = null;

    for (let i = 0; i < parts.length; i++) {

      const p = parts[i];

      // spawn system
      if (p === "spawn") {

        spawn = parts[i + 1] || null;

        if (parts.includes("p")) {
          pathfinding = true;
        }

      }

      // chest
      if (p.startsWith("LT")) {

        chestLuck = parseInt(p.substring(2)) || 1;

      }

      // block naam (eerste deel)
      if (i === 0) {
        block = p;
      }

    }

    // chest tile
    if (chestLuck !== null) {
      return {
        block: "chest",
        type: "c",
        luck: chestLuck
      };
    }

    // spawn tile
    if (spawn) {
      return {
        block: block,
        spawn: spawn,
        pathfinding: pathfinding
      };
    }

    // normale block
    return block;

  }

  // -------------------------
  // Structuur plaatsen
  // -------------------------
  placeStructure(world, structure, wx, wy) {

    const w = structure[0].length;
    const h = structure.length;

    const grid = [];

    for (let y = 0; y < h; y++) {

      grid[y] = [];

      for (let x = 0; x < w; x++) {

        const raw = structure[y][x];

        grid[y][x] = this.parseCell(raw);

      }

    }

    world.structures.push({
      x: wx,
      y: wy,
      w,
      h,
      grid
    });

  }

  // -------------------------
  // Overlap check
  // -------------------------
  checkOverlap(structures, x, y, w, h) {

    for (const s of structures) {

      if (
        x < s.x + s.w &&
        x + w > s.x &&
        y < s.y + s.h &&
        y + h > s.y
      ) {
        return true;
      }

    }

    return false;

  }

  // -------------------------
  // Enemy spawns uitvoeren
  // -------------------------
  handleSpawns(enemyManager, wx, wy, structure) {

    for (let y = 0; y < structure.length; y++) {

      for (let x = 0; x < structure[y].length; x++) {

        const raw = structure[y][x];

        const cell = this.parseCell(raw);

        if (cell && typeof cell === "object" && cell.spawn) {

          const sx = wx + x;
          const sy = wy + y;

          console.log("enemyManager object:", enemyManager);
          console.log("spawn function:", enemyManager.spawn);

          enemyManager.spawn(
            cell.spawn,
            sx,
            sy,
            cell.pathfinding
          );

          console.log("SPAWN ENEMY:", cell.spawn, sx, sy);

        }

      }

    }

  }

  // -------------------------
  // Random structuur kiezen
  // -------------------------
  getRandomStructure() {

    const names = Object.keys(this.structures);

    const possible = names.filter(name => {

      const chance = this.metadata[name]?.chance ?? 0.2;

      return Math.random() < chance;

    });

    if (!possible.length) return null;

    const name = possible[Math.floor(Math.random() * possible.length)];

    return this.structures[name];

  }

  // -------------------------
  // Spawn in chunk
  // -------------------------
  spawnStructuresInChunk(world, cx, cy, maxStructures = 3) {

    let spawned = 0;

    while (spawned < maxStructures) {

      const structure = this.getRandomStructure();

      if (!structure) break;

      const w = structure[0].length;
      const h = structure.length;

      const wx =
        cx * world.chunkSize +
        Math.floor(Math.random() * (world.chunkSize - w));

      const wy =
        cy * world.chunkSize +
        Math.floor(Math.random() * (world.chunkSize - h));

      if (this.checkOverlap(world.structures, wx, wy, w, h)) continue;

      this.placeStructure(world, structure, wx, wy);

      if (world.enemyManager) {

        this.handleSpawns(world.enemyManager, wx, wy, structure);

      }

      spawned++;

    }

  }

  // -------------------------
  // Debug lijst
  // -------------------------
  getStructureList() {

    return Object.keys(this.structures).map(name => ({

      name,

      chance: this.metadata[name]?.chance ?? 0.2,

      rare: this.metadata[name]?.rare ?? false,

      width: this.structures[name][0].length,

      height: this.structures[name].length

    }));

  }

}
