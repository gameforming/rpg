// combat.js
export class Combat {
  constructor(player, world){
    this.player = player;
    this.world = world;

    // Progressie
    this.level = 1;
    this.xp = 0;
    this.maxXp = 100;

    // Combat
    this.lastAttack = 0;
    this.attackCooldown = 500;

    // Currency
    this.gold = 0;

    this.enemiesManager = null; // voeg toe en in main.js vullen

    // Player HP
    this.player.maxHp = this.player.maxHp || 100;
    this.player.hp = this.player.hp || this.player.maxHp;
  }

  // XP systeem
  gainXp(amount){
    this.xp += amount;

    while(this.xp >= this.maxXp){
      this.xp -= this.maxXp;
      this.levelUp();
    }
  }

  levelUp(){
    this.level++;

    // XP scaling
    this.maxXp = Math.floor(this.maxXp * 1.5);

    // HP scaling
    this.player.maxHp = Math.floor(this.player.maxHp * 1.1);
    this.player.hp = this.player.maxHp;
  }

  canAttack(time){
    return time - this.lastAttack >= this.attackCooldown;
  }

  attack(weapon, mouseX, mouseY, camera, time, input){
    if (!weapon || !this.canAttack(time)) return;

    this.lastAttack = time;

    const wx = this.player.x;
    const wy = this.player.y;

    const range = weapon.range || { width: 1, length: 1 };
    const attackWidth = range.width * this.world.tileSize;
    const attackLength = range.length * this.world.tileSize;

    const dx = mouseX + camera.x - wx;
    const dy = mouseY + camera.y - wy;
    const angle = Math.atan2(dy, dx);

    const halfW = attackWidth / 2;
    const attackRect = {
      x: wx + Math.cos(angle) * attackLength - halfW,
      y: wy + Math.sin(angle) * attackLength - halfW,
      w: attackLength,
      h: attackWidth
    };

    for (let e of this.enemiesManager.enemies) { // <-- gebruik this.enemiesManager
        if (e.dead) continue;
        if (e.x > attackRect.x && e.x < attackRect.x + attackRect.w &&
            e.y > attackRect.y && e.y < attackRect.y + attackRect.h) {
            e.hp -= weapon.damage;
            if (e.hp <= 0) {
                e.dead = true;
                this.gainXp(10);


      const goldDropped = this.enemiesManager.enemyTypes[e.type]?.gold || 1;
      this.gold += goldDropped;
      console.log(`[COMBAT] ${e.type} dood, gold +${goldDropped}`);
            }
        }
    }
}

  // UI tekenen
  drawUI(ctx, canvas){

    // HP BAR
    const hpBarWidth = 200;
    const hp = this.player.hp;
    const maxHp = this.player.maxHp;

    ctx.fillStyle = "black";
    ctx.fillRect(20,20,hpBarWidth,20);

    ctx.fillStyle = "red";
    ctx.fillRect(20,20,(hp/maxHp)*hpBarWidth,20);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(20,20,hpBarWidth,20);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`HP: ${hp}/${maxHp}`,25,35);

    // XP BAR
    const xpBarWidth = 150;
    const xPos = canvas.width - xpBarWidth - 20;

    ctx.fillStyle = "black";
    ctx.fillRect(xPos,20,xpBarWidth,20);

    ctx.fillStyle = "green";
    ctx.fillRect(xPos,20,(this.xp/this.maxXp)*xpBarWidth,20);

    ctx.strokeStyle = "white";
    ctx.strokeRect(xPos,20,xpBarWidth,20);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`LV ${this.level}`,xPos,15);

    // GOLD UI (boven midden)
    const goldWidth = 200;

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(canvas.width/2 - goldWidth/2, 10, goldWidth, 30);

    ctx.strokeStyle = "white";
    ctx.strokeRect(canvas.width/2 - goldWidth/2, 10, goldWidth, 30);

    ctx.fillStyle = "gold";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";

    ctx.fillText(`Gold: ${this.gold}`, canvas.width/2, 30);

    ctx.textAlign = "left";
  }
}

// beschikbaar maken
window.combat = null;
