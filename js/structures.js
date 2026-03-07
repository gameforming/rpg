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

grid.push(cols)

}

this.structures[name] = grid

}

get(name){
return this.structures[name]
}

}
