class Enemy{
  constructor(type, x, y, data, texture, weaponTexture){
    this.type = type
    this.x = x
    this.y = y

    this.hp = data.hp
    this.speed = data.speed
    this.damage = data.damage
    this.range = data.range

    this.texture = texture
    this.weaponTexture = weaponTexture

    this.weapon = data.weapon
    this.attackfunction = data.attackfunction

    this.dead = false
    this.attackCooldown = 0
  }

  update(player, deltaTime){
    if(this.dead) return

    let dx = player.x - this.x
    let dy = player.y - this.y
    let dist = Math.hypot(dx, dy)

    if(dist > 5){
      this.x += dx / dist * this.speed
      this.y += dy / dist * this.speed
    }

    if(this.attackCooldown > 0) this.attackCooldown -= deltaTime
  }

  draw(ctx, camera){
    if(this.dead) return

    if(this.texture){
      ctx.drawImage(
        this.texture,
        this.x - camera.x - 16,
        this.y - camera.y - 16,
        32,
        32
      )
    }

    if(this.weaponTexture){
      ctx.drawImage(
        this.weaponTexture,
        this.x - camera.x + 10,
        this.y - camera.y - 8,
        16,
        16
      )
    }
  }

  canAttack(){
    return this.attackCooldown <= 0
  }

  resetCooldown(){
    this.attackCooldown = 1000 // 1 seconde cooldown
  }
}

class EnemyManager{
  constructor(){
    this.enemyTypes = {}
    this.enemyTextures = {}
    this.enemies = []
  }

  async load(){
    let r = await fetch("data/enemys.json")
    this.enemyTypes = await r.json()

    for(let type in this.enemyTypes){
      let texName = this.enemyTypes[type].texture
      let img = new Image()
      img.src = "assets/" + texName
      await new Promise(res => img.onload = res)
      img = await makeTransparent(img)
      this.enemyTextures[type] = img
    }
  }

  spawn(type, x, y){
    let data = this.enemyTypes[type]
    if(!data){
      console.error("Enemy type bestaat niet:", type)
      return
    }

    let tex = this.enemyTextures[type]
    let weaponTex = itemTextures[data.weapon]

    let enemy = new Enemy(
      type,
      x,
      y,
      data,
      tex,
      weaponTex
    )

    this.enemies.push(enemy)
  }

  update(player, deltaTime){
    for(let e of this.enemies){
      e.update(player, deltaTime)
    }
    this.enemies = this.enemies.filter(e => !e.dead)
  }

  draw(ctx, camera){
    for(let e of this.enemies){
      e.draw(ctx, camera)
    }
  }
}

window.enemies = new EnemyManager()
