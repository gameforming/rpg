export class Combat {
  constructor(player, world){
    this.player = player        // speler object
    this.world = world          // world object, nodig voor tileSize
    this.level = 1              // start level
    this.xp = 0                 // start XP
    this.maxXp = 100 + 10 * this.level
    this.lastAttack = 0
    this.attackCooldown = 500  // halve seconde cooldown
  }

  // XP toevoegen en levels updaten
  gainXp(amount){
    this.xp += amount
    while(this.xp >= this.maxXp){
      this.xp -= this.maxXp
      this.levelUp()
    }
  }

  levelUp(){
    this.level++
    this.maxXp = Math.floor(this.maxXp * 1.5)
  }

  canAttack(time){
    return time - this.lastAttack >= this.attackCooldown
  }

  // Spatie-triggered aanval
  attack(enemies, weapon, mouseX, mouseY, camera, time, input){
    // check input: alleen spatie start de attack
    if(!this.player.keys[" "] && !this.player.keys["space"] && !this.player.keys["spacebar"]) return
    if(!weapon || !this.canAttack(time)) return

    this.lastAttack = time

    // start swing animatie
    if(!this.player.weaponSwinging){
      this.player.weaponSwinging = true
      this.player.weaponSwing = 0
    }

    let wx = this.player.x
    let wy = this.player.y

    // weapon range
    let range = weapon.range || {width:3,length:3}
    let attackWidth = range.width * this.world.tileSize
    let attackLength = range.length * this.world.tileSize

    // richting van de muis
    let dx = mouseX + camera.x - wx
    let dy = mouseY + camera.y - wy
    let angle = Math.atan2(dy, dx)

    // attack box
    let halfW = attackWidth / 2
    let attackRect = {
      x: wx + Math.cos(angle) * attackLength - halfW,
      y: wy + Math.sin(angle) * attackLength - halfW,
      w: attackLength,
      h: attackWidth
    }

    // damage toepassen op enemies in box
    for(let e of enemies.enemies){
      if(e.dead) continue
      if(e.x > attackRect.x && e.x < attackRect.x + attackRect.w &&
         e.y > attackRect.y && e.y < attackRect.y + attackRect.h){
        e.hp -= weapon.damage
        if(e.hp <= 0) e.dead = true
        this.gainXp(10)
      }
    }
  }

  // UI tekenen
  drawUI(ctx, canvas){
    // HP linksboven
    let hpBarWidth = 200
    let hp = this.player.hp || 1
    let maxHp = this.player.maxHp || 1
    ctx.fillStyle = "black"
    ctx.fillRect(20, 20, hpBarWidth, 20)
    ctx.fillStyle = "red"
    ctx.fillRect(20, 20, (hp/maxHp)*hpBarWidth, 20)
    ctx.strokeStyle = "white"
    ctx.strokeRect(20, 20, hpBarWidth, 20)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(`HP: ${hp}/${maxHp}`, 25, 35)

    // Level + XP rechtsboven
    let xpBarWidth = 150
    let xPos = canvas.width - xpBarWidth - 20
    ctx.fillStyle = "black"
    ctx.fillRect(xPos, 20, xpBarWidth, 20)
    ctx.fillStyle = "green"
    ctx.fillRect(xPos, 20, (this.xp/this.maxXp)*xpBarWidth, 20)
    ctx.strokeStyle = "white"
    ctx.strokeRect(xPos, 20, xpBarWidth, 20)
    ctx.fillStyle = "white"
    ctx.font = "16px Arial"
    ctx.fillText(`LV ${this.level}`, xPos, 15)
  }
}

// maak beschikbaar voor main.js
window.combat = null
