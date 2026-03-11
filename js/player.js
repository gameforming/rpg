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
this.keys[e.key.toLowerCase()] = true
})

window.addEventListener("keyup", e=>{
this.keys[e.key.toLowerCase()] = false
})

}


update(world, mouseX, mouseY, camera){

let newX = this.x
let newY = this.y

// beweging
if(this.keys["w"]) newY -= this.speed
if(this.keys["s"]) newY += this.speed
if(this.keys["a"]) newX -= this.speed
if(this.keys["d"]) newX += this.speed


// weapon richting
const dx = mouse.x + camera.x - this.x
const dy = mouse.y + camera.y - this.y

this.weaponAngle = Math.atan2(dy, dx)


// swing animatie
if(this.weaponSwinging){

this.weaponSwing += 0.25

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

const texture = itemTextures[selectedItem.id]
if(!texture) return

let angle = this.weaponAngle

if(this.weaponSwinging){
angle += Math.sin(this.weaponSwing) * 0.8
}

const offset = 20

const wx = this.x + Math.cos(this.weaponAngle) * offset
const wy = this.y + Math.sin(this.weaponAngle) * offset

ctx.save()

ctx.translate(
wx - camera.x,
wy - camera.y
)

ctx.rotate(angle)

ctx.globalAlpha = this.weaponSwinging ? 1 : 0.6

ctx.drawImage(texture,-16,-16,32,32)

ctx.restore()

}

}
