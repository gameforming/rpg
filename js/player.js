class Player{

constructor(){

this.x = 0
this.y = 0

this.size = 20
this.speed = 3

this.keys = {}

window.addEventListener("keydown",e=>{
this.keys[e.key.toLowerCase()] = true
})

window.addEventListener("keyup",e=>{
this.keys[e.key.toLowerCase()] = false
})

}

update(){

let newX = this.x
let newY = this.y

if(this.keys["w"]) newY -= this.speed
if(this.keys["s"]) newY += this.speed
if(this.keys["a"]) newX -= this.speed
if(this.keys["d"]) newX += this.speed

let tileX = Math.floor((newX+this.size/2)/32)
let tileY = Math.floor((newY+this.size/2)/32)

if(world.isWalkable(tileX,tileY)){

this.x = newX
this.y = newY

}

}

draw(ctx,camera){

ctx.fillStyle="red"

ctx.fillRect(
this.x-camera.x,
this.y-camera.y,
this.size,
this.size
)

}

}
