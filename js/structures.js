class StructureManager{

constructor(blocks){

this.blocks = blocks
this.structures = {}

}

async loadStructure(name){

let res = await fetch("structures/"+name+".txt")

let text = await res.text()

let rows = text.trim().split("\n")

let grid = []

for(let row of rows){

let cols = row.split(",")

let parsedRow = []

for(let cell of cols){

let parts = cell.split(".")

let block = parts[0]

let type = parts[1] || "p"

parsedRow.push({
block:block,
type:type
})

}

grid.push(parsedRow)

}

this.structures[name] = grid

}

async loadAll(){

let list = [
"tree"
"house"
]

for(let s of list){

await this.loadStructure(s)

}

}

get(name){

return this.structures[name]

}

getRandom(){

let keys = Object.keys(this.structures)

return this.structures[
keys[Math.floor(Math.random()*keys.length)]
]

}

}
