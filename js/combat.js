class Combat {
  constructor(player) {
    this.player = player
    this.level = 1
    this.xp = 0
    this.maxXp = 100 + 10 * this.level
    this.lastAttack = 0
    this.attackCooldown = 1000 // 1 seconde tussen clicks
  }

  gainXp(amount) {
    this.xp += amount
    while(this.xp >= this.maxXp){
      this.xp -= this.maxXp
      this.levelUp()
    }
  }

  levelUp() {
    this.level++
    this.maxXp = Math.floor(this.maxXp * 1.5)
  }

  canAttack(time){
    return time - this.lastAttack >= this.attackCooldown
  }

  attack(enemies, weapon, mouseX, mouseY, camera, time){
    if(!this.canAttack(time)) return
    this.lastAttack = time

    let wx = this.player.x
    let wy = this.player.y

    let range = weapon.range || {width:3,length:3}
    let attackWidth = range.width * world.tileSize
    let attackLength = range.length * world.tileSize

    // richting van muis
    let dx = mouseX + camera.x - wx
    let dy = mouseY + camera.y - wy
    let angle = Math.atan2(dy, dx)

    // simpele axis-aligned attack box
    let halfW = attackWidth/2
    let attackRect = {
      x: wx + Math.cos(angle)*attackLength - halfW,
      y: wy + Math.sin(angle)*attackLength - halfW,
      w: attackLength,
      h: attackWidth
    }

    for(let e of enemies.enemies){
      if(e.dead) continue
      if(e.x > attackRect.x && e.x < attackRect.x + attackRect.w &&
         e.y > attackRect.y && e.y < attackRect.y + attackRect.h){
        e.hp -= weapon.damage
        if(e.hp <=0) e.dead = true
        this.gainXp(10)
      }
    }
  }

  drawUI(ctx, canvas){
    // HP linksboven
    let hpBarWidth = 200
    let hp = this.player.hp
    let maxHp = this.player.maxHp
    ctx.fillStyle="black"
    ctx.fillRect(20,20,hpBarWidth,20)
    ctx.fillStyle="red"
    ctx.fillRect(20,20,(hp/maxHp)*hpBarWidth,20)
    ctx.strokeStyle="white"
    ctx.strokeRect(20,20,hpBarWidth,20)
    ctx.fillStyle="white"
    ctx.font="16px Arial"
    ctx.fillText(`HP: ${hp}/${maxHp}`, 25, 35)

    // Level + XP rechtsboven
    let xpBarWidth = 150
    let xPos = canvas.width - xpBarWidth - 20
    ctx.fillStyle="black"
    ctx.fillRect(xPos,20,xpBarWidth,20)
    ctx.fillStyle="green"
    ctx.fillRect(xPos,20,(this.xp/this.maxXp)*xpBarWidth,20)
    ctx.strokeStyle="white"
    ctx.strokeRect(xPos,20,xpBarWidth,20)
    ctx.fillStyle="white"
    ctx.fillText(`LV ${this.level}`, xPos, 15)
  }
}

window.combat = null
