class World{

constructor(blocks,textures){

this.tileSize = 32

this.blocks = blocks
this.textures = textures

this.chunkSize = 32

this.chunks = {}

this.structures = []

}

getChunkKey(cx,cy){

return cx + "," + cy

}

generateChunk(cx,cy){

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

this.chunks[this.getChunkKey(cx,cy)] = chunk

this.trySpawnStructure(cx,cy)

}

trySpawnStructure(cx,cy){

if(!window.structures) return

// spawn chance
if(Math.random() > 0.6) return

let structure = window.structures.getRandom()

if(!structure) return

let width = structure[0].length
let height = structure.length

let posX = Math.floor(Math.random()*(this.chunkSize-width))
let posY = Math.floor(Math.random()*(this.chunkSize-height))

let worldX = cx*this.chunkSize + posX
let worldY = cy*this.chunkSize + posY

if(this.checkOverlap(worldX,worldY,width,height)) return

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
return true
}

}

return false

}

placeStructure(structure,x,y){

let w = structure[0].length
let h = structure.length

this.structures.push({
x:x,
y:y,
w:w,
h:h,
grid:structure
})

}

getStructureTile(wx,wy){

for(let s of this.structures){

let sx = wx - s.x
let sy = wy - s.y

if(
sx >= 0 &&
sy >= 0 &&
sx < s.w &&
sy < s.h
){

return s.grid[sy][sx]

}

}

return null

}

getBaseTile(wx,wy){

let cx = Math.floor(wx/this.chunkSize)
let cy = Math.floor(wy/this.chunkSize)

let key = this.getChunkKey(cx,cy)

if(!this.chunks[key]){
this.generateChunk(cx,cy)
}

let chunk = this.chunks[key]

let tx = ((wx % this.chunkSize)+this.chunkSize)%this.chunkSize
let ty = ((wy % this.chunkSize)+this.chunkSize)%this.chunkSize

return chunk[ty][tx]

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

let block = this.blocks[tile.block]

if(!block) continue

let tex = this.textures[block.texture]

if(!tex) continue

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
