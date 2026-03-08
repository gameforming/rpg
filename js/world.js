class World{

constructor(blocks,textures){

console.log("WORLD: constructor gestart")

this.tileSize = 32
this.blocks = blocks
this.textures = textures

this.chunkSize = 32

this.chunks = {}
this.structures = []

console.log("WORLD: blocks geladen:",blocks)
console.log("WORLD: textures geladen:",textures)

}



getChunkKey(cx,cy){

return cx + "," + cy

}



generateChunk(cx,cy){

let key = this.getChunkKey(cx,cy)

console.log("WORLD: chunk genereren",key)

let chunk = []

for(let y=0;y<this.chunkSize;y++){

let row=[]

for(let x=0;x<this.chunkSize;x++){

row.push({
block:"grass",
type:"p"
})

}

chunk.push(row)

}

this.chunks[key] = chunk

console.log("WORLD: chunk gemaakt",key)

this.trySpawnStructure(cx,cy)

}



trySpawnStructure(cx,cy){

console.log("WORLD: proberen structure te spawnen in chunk",cx,cy)

if(!window.structures){

console.warn("WORLD: structure manager niet geladen")
return

}

let structure = window.structures.getRandom()

if(!structure){

console.warn("WORLD: geen structures gevonden")
return

}

let width = structure[0].length
let height = structure.length

console.log("WORLD: gekozen structure grootte",width,height)

let posX = Math.floor(Math.random()*(this.chunkSize-width))
let posY = Math.floor(Math.random()*(this.chunkSize-height))

let worldX = cx*this.chunkSize + posX
let worldY = cy*this.chunkSize + posY

console.log("WORLD: structure spawn positie",worldX,worldY)

if(this.checkOverlap(worldX,worldY,width,height)){

console.warn("WORLD: structure overlap gedetecteerd, spawn geannuleerd")

return
}

this.placeStructure(structure,worldX,worldY)

}



checkOverlap(x,y,w,h){

for(let s of this.structures){

if(
x < s.x + s.w &&
x + w > s.x &&
y < s.y + s.h &&
y + h > s.y
){

console.warn("WORLD: overlap met structure",s)

return true

}

}

return false

}



placeStructure(structure,x,y){

console.log("WORLD: structure plaatsen op",x,y)

let w = structure[0].length
let h = structure.length

this.structures.push({
x:x,
y:y,
w:w,
h:h,
grid:structure
})

console.log("WORLD: structure opgeslagen",this.structures)

}



getStructureTile(wx,wy){

for(let s of this.structures){

let sx = wx - s.x
let sy = wy - s.y

if(
sx>=0 &&
sy>=0 &&
sx<s.w &&
sy<s.h
){

let tile = s.grid[sy][sx]

console.log("WORLD: structure tile gevonden",tile)

return tile

}

}

return null

}



getBaseTile(wx,wy){

let cx = Math.floor(wx/this.chunkSize)
let cy = Math.floor(wy/this.chunkSize)

let key = this.getChunkKey(cx,cy)

if(!this.chunks[key]){

console.log("WORLD: chunk bestaat niet, genereren")

this.generateChunk(cx,cy)

}

let chunk = this.chunks[key]

let tx = ((wx % this.chunkSize)+this.chunkSize)%this.chunkSize
let ty = ((wy % this.chunkSize)+this.chunkSize)%this.chunkSize

let tile = chunk[ty][tx]

if(!tile){

console.error("WORLD: tile bestaat niet",wx,wy)
}

return tile

}



getTile(wx,wy){

let structureTile = this.getStructureTile(wx,wy)

if(structureTile){

return structureTile
}

return this.getBaseTile(wx,wy)

}



isWalkable(wx,wy){

let tile = this.getTile(wx,wy)

if(!tile){

console.error("WORLD: walkable check tile ontbreekt")
return true
}

return tile.type !== "w"

}



draw(ctx,camera){

let startX = Math.floor(camera.x/this.tileSize)-2
let startY = Math.floor(camera.y/this.tileSize)-2

let endX = startX + Math.ceil(canvas.width/this.tileSize)+4
let endY = startY + Math.ceil(canvas.height/this.tileSize)+4

for(let y=startY;y<endY;y++){

for(let x=startX;x<endX;x++){

let tile = this.getTile(x,y)

if(!tile){

console.error("WORLD: draw tile ontbreekt",x,y)
continue

}

let block = this.blocks[tile.block]

if(!block){

console.error("WORLD: block niet gevonden",tile.block)
continue
}

let tex = this.textures[block.texture]

if(!tex){

console.error("WORLD: texture niet gevonden",block.texture)
continue
}

ctx.drawImage(
tex,
x*this.tileSize-camera.x,
y*this.tileSize-camera.y,
this.tileSize,
this.tileSize
)

}

}

}

}
