class CombatSystem{

 constructor(){
  this.level=1
  this.xp=0
  this.baseXpNeeded=100+10*this.level
  this.xpNeeded=Math.floor(this.baseXpNeeded*1.5)

  this.lastAttack=0
  this.attackCooldown=1000
 }

 addXP(amount){
  this.xp+=amount
  this.checkLevelUp()
 }

 checkLevelUp(){
  while(this.xp>=this.xpNeeded){
   this.xp-=this.xpNeeded
   this.level++

   this.baseXpNeeded=100+10*this.level
   this.xpNeeded=Math.floor(this.baseXpNeeded*1.5)

   console.log("LEVEL UP:",this.level)
  }
 }

 getLevel(){return this.level}
 getXP(){return this.xp}
 getXPNeeded(){return this.xpNeeded}
 getProgress(){return this.xp/this.xpNeeded}

 attack(player,mouse,weapon,enemies){
  let now=Date.now()
  if(now-this.lastAttack<this.attackCooldown)return
  this.lastAttack=now

  if(!weapon||!weapon.damage)return

  let range=weapon.range||{width:3,length:9}

  let dx=mouse.x-player.x
  let dy=mouse.y-player.y
  let len=Math.hypot(dx,dy)
  if(len===0)return

  dx/=len
  dy/=len

  let centerX=player.x+dx*(range.length*16)
  let centerY=player.y+dy*(range.length*16)

  let halfW=(range.width*16)/2
  let halfL=(range.length*16)/2

  for(let enemy of enemies){

   let ex=enemy.x
   let ey=enemy.y

   let relX=ex-player.x
   let relY=ey-player.y

   let dot=relX*dx+relY*dy
   if(dot<0||dot>range.length*32)continue

   let perp=Math.abs(relX*dy-relY*dx)
   if(perp>halfW)continue

   enemy.hp-=weapon.damage
   console.log("HIT",enemy,weapon.damage)

   if(enemy.hp<=0){
    enemy.dead=true
    this.addXP(enemy.xp||10)
   }
  }
 }

}

window.combat=new CombatSystem()
