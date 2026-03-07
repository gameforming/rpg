class Player{

constructor(){

this.x = 0
this.y = 0

this.speed = 3

this.size = 32

this.keys = {}

window.addEventListener("keydown",e=>{
this.keys[e.key.toLowerCase()] = true
})

window.addEventListener("keyup",e=>{
this.keys[e.key.toLowerCase()] = false
})

}

update(){

if(this.keys["w"]) this.y -= this.speed
if(this.keys["s"]) this.y += this.speed
if(this.keys["a"]) this.x -= this.speed
if(this.keys["d"]) this.x += this.speed

}

draw(ctx,camera){

ctx.fillStyle = "red"

ctx.fillRect(
this.x - camera.x,
this.y - camera.y,
this.size,
this.size
)

}

}
