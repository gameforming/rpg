export class Player {

constructor(){

this.x = 0
this.y = 0

this.size = 20
this.speed = 3

this.weaponAngle = 0
this.weaponSwing = 0
this.weaponSwinging = false

this.keys = {}

window.addEventListener("keydown", e=>{

const key = e.key.toLowerCase()

this.keys[key] = true

// aanval met spatie
if(key === " " || key === "space" || key === "spacebar"){

if(!this.weaponSwinging){

this.weaponSwinging = true
this.weaponSwing = 0

}

}

})

window.addEventListener("keyup", e=>{
this.keys[e.key.toLowerCase()] = false
})

}


// Player.js
update(world, mouse, camera){

const dx = mouse.x + camera.x - this.x
const dy = mouse.y + camera.y - this.y

this.weaponAngle = Math.atan2(dy, dx)

let newX = this.x
let newY = this.y

// beweging
if(this.keys["w"]) newY -= this.speed
if(this.keys["s"]) newY += this.speed
if(this.keys["a"]) newX -= this.speed
if(this.keys["d"]) newX += this.speed


// swing animatie
if(this.weaponSwinging){

this.weaponSwing += 0.35

if(this.weaponSwing > Math.PI){

this.weaponSwinging = false
this.weaponSwing = 0

}

}


// collision
let tileX = Math.floor((newX + this.size/2) / 32)
let tileY = Math.floor((newY + this.size/2) / 32)

if(world.isWalkable(tileX, tileY)){

this.x = newX
this.y = newY

}

}


draw(ctx, camera){

ctx.fillStyle = "red"

ctx.fillRect(
this.x - camera.x,
this.y - camera.y,
this.size,
this.size
)

}


drawWeapon(ctx, camera, selectedItem, itemTextures){

if(!selectedItem) return
if(selectedItem.type !== "weapon") return

const texture = itemTextures[selectedItem.id] || selectedItem.image
if(!texture) return

let angle = this.weaponAngle

// swing rotatie
if(this.weaponSwinging){
angle += Math.sin(this.weaponSwing) * 0.8
}

// basis afstand
let offset = 20

// swing naar voren en terug
if(this.weaponSwinging){
offset += Math.sin(this.weaponSwing) * 10
}

const wx = this.x + Math.cos(this.weaponAngle) * offset
const wy = this.y + Math.sin(this.weaponAngle) * offset

ctx.save()

ctx.translate(
wx - camera.x,
wy - camera.y
)

// correctie omdat sword sprite 45° gedraaid is
ctx.rotate(angle + Math.PI / 4)

ctx.globalAlpha = this.weaponSwinging ? 1 : 0.6

ctx.drawImage(texture,-16,-16,32,32)

ctx.restore()

}

}
