const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

// --- Canvas sizing ---
function fitCanvas() {
	const rect = canvas.getBoundingClientRect();
	// reset transform then size according to devicePixelRatio
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	canvas.width = Math.round(rect.width * devicePixelRatio);
	canvas.height = Math.round(rect.height * devicePixelRatio);
	ctx.scale(devicePixelRatio, devicePixelRatio);
}

if (!canvas.style.height) canvas.style.height = '420px';
// Expand canvas visual size to requested proportions (80% width of viewport, 2.5x original height)
function expandCanvasArea(){
	const targetW = Math.round(window.innerWidth * 0.6);
	const baseH = 400; // original design height
	const targetH = Math.round(baseH * 2.0);
	canvas.style.width = targetW + 'px';
	canvas.style.height = targetH + 'px';
	fitCanvas();
}

expandCanvasArea();
window.addEventListener('resize', () => { fitCanvas(); draw(); });

// --- Game state ---
let running = false;
let gameOver = false;
let followEnabled = false; // after start, follow mouse X/Y
let mouseX = 0;
let mouseY = 0;
let frame = 0;
let score = 0;

// base fire interval (in frames) before attackSpeed multiplier
const baseFireInterval = 26;

const player = { x: 100, y: 200, r: 16, vy: 0 };
// player HP
player.hp = 3;
player.maxHp = 10;
player.invulnerable = false;
player.invTimer = 0;

let playerBullets = [];
let enemies = [];
let enemyBullets = [];
let lastBossScore = 0;
let lifePlanes = [];
let playerEffects = []; // visual effects attached to player (hit rings, particles)

// --- Helpers ---
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function rnd(min, max){ return min + Math.random() * (max - min); }

function reset() {
	player.x = 100;
	player.y = (canvas.height / devicePixelRatio) / 2;
	player.vy = 0;
	player.hp = 3;
	player.invulnerable = false;
	player.invTimer = 0;
	playerBullets = [];
	enemies = [];
	enemyBullets = [];
	frame = 0;
	score = 0;
	gameOver = false;
}

function spawnLifePlane(){
	const W = canvas.width / devicePixelRatio;
	const x = 30 + Math.random() * (W - 60);
	const vy = 0.9 + Math.random() * 1.2;
	lifePlanes.push({ x, y: -20, w: 26, h: 18, vy });
}

function createHitEffect(){
	// subtle expanding ring to indicate hit without blocking view
	const life = 18; // frames (short, non-obstructive)
	playerEffects.push({ x: player.x, y: player.y, life: life, maxLife: life, startR: player.r + 6, endR: player.r + 28, color: '#ff6b6b' });
}

function spawnEnemy() {
	const W = canvas.width / devicePixelRatio;
	const margin = 30;
	// limit amplitude so enemy oscillation stays inside screen
	const ampMax = Math.min(100, Math.floor(W * 0.22));
	const amp = 10 + Math.random() * Math.max(10, ampMax - 10);
	// choose an origin x so that ox +/- amp stays within visible area
	let ox = margin + Math.random() * (W - margin * 2);
	ox = clamp(ox, margin + amp, W - margin - amp);
	const vy = 0.6 + Math.random() * 1.4 + Math.min(1.5, score * 0.02);
	const freq = 0.02 + Math.random() * 0.06;
	const phase = Math.random() * Math.PI * 2;
	const shootType = Math.random() < 0.15 ? 'burst' : (Math.random() < 0.4 ? 'fast' : 'single');
	const shootTimer = 30 + Math.floor(Math.random()*90);
	// start just above the visible top so they appear quickly
	const startY = - (22 / 2) - 6;
	enemies.push({ x: ox, ox: ox, y: startY, w: 34, h: 22, vy, amp, freq, phase, shootType, shootTimer, burstLeft: 0 });
}

function spawnBoss() {
	const W = canvas.width / devicePixelRatio;
	const margin = 60;
	const w = 140; const h = 80;
	// spawn boss somewhere within visible horizontal area
	const x = clamp(Math.round(W/2 + (Math.random()-0.5) * 120), margin + w/2, W - margin - w/2);
	const vy = 0.35; // slow descent
		// boss HP scales with score but cap the max HP at 10
		const hp = Math.min(10, 5 + Math.floor(score / 10)); // boss HP scales: 5 + score/10, capped at 10
	const shootTimer = 80; // initial
	// start slightly above visible area so it appears quickly
		enemies.push({ x, ox: x, y: - (h/2) - 8, w, h, vy, isBoss: true, hp, maxHp: hp, shootTimer, shootCooldown: 40, invulnerable: false, invTimer: 0 });
}

function firePlayerBullet(){
	// number of bullets: 1 + 1 per 15 score, capped at 3
	const count = Math.min(3, 1 + Math.floor(score / 15));
	const speed = 6;
	const spread = 0.18; // radians between bullets
	const center = -Math.PI/2; // upward
	for (let i = 0; i < count; i++){
		const offset = (i - (count - 1) / 2) * spread;
		const angle = center + offset;
		const vx = Math.cos(angle) * speed;
		const vy = Math.sin(angle) * speed;
		playerBullets.push({ x: player.x, y: player.y - player.r - 6, vx, vy, r: 4 });
	}
}
function fireEnemyBullet(e){
	// fire a single enemy bullet angled away from the nearest wall
	const W = canvas.width / devicePixelRatio;
	const leftDist = e.x;
	const rightDist = W - e.x;
	const maxTiltDeg = 30; // degrees
	const deg = (Math.PI / 180);
	let angle;
	// base downward angle
	const down = Math.PI / 2;
	if (leftDist < rightDist) {
		// near left wall -> tilt to the right (downwards but toward center)
		angle = down - (Math.random() * maxTiltDeg * deg);
	} else {
		// near right wall -> tilt to the left
		angle = down + (Math.random() * maxTiltDeg * deg);
	}
	const speed = 3 + Math.random() * 1.8;
	const vx = Math.cos(angle) * speed;
	const vy = Math.sin(angle) * speed;
	enemyBullets.push({ x: e.x, y: e.y + e.h/2, vx, vy, r: 4 });
}

function fireBossSpread(e){
	// fire bullets in multiple directions (downward spread)
	const count = 12;
	const speed = 2.4 + Math.min(2.5, 0.1 * Math.floor(score/5));
	for (let i=0;i<count;i++){
		const angle = (Math.PI*0.6) * (i/(count-1) - 0.5) + Math.PI/2; // fan downward
		const vx = Math.cos(angle) * speed;
		const vy = Math.sin(angle) * speed;
		enemyBullets.push({ x: e.x + (i-count/2)*4, y: e.y + e.h/2, vx, vy, r: 4 });
	}
}

function fireBoss360(e){
    // full-circle radial shot from boss center
    const count = 24;
    const speed = 2.4 + Math.min(2.8, 0.08 * Math.floor(score/5));
    for (let i = 0; i < count; i++){
        const angle = (Math.PI * 2) * (i / count);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        enemyBullets.push({ x: e.x + Math.cos(angle) * 8, y: e.y + Math.sin(angle) * 8, vx, vy, r: 4 });
    }
}

function fireBossHitPattern(e){
	// Boss hit reaction: radial burst + aimed shots at player
	const count = 20;
	const baseSpeed = 3.0 + Math.min(2.0, 0.05 * Math.floor(score));
	for (let i=0;i<count;i++){
		const angle = (Math.PI*2) * (i / count);
		const vx = Math.cos(angle) * baseSpeed;
		const vy = Math.sin(angle) * baseSpeed;
		enemyBullets.push({ x: e.x + Math.cos(angle)*10, y: e.y + Math.sin(angle)*10, vx, vy, r: 4 });
	}
	// aimed spread toward player
	const aimBase = Math.atan2(player.y - e.y, player.x - e.x);
	for (let s = -2; s <= 2; s++){
		const angle = aimBase + s * 0.12;
		const sp = baseSpeed + 1.2;
		enemyBullets.push({ x: e.x, y: e.y + e.h/2, vx: Math.cos(angle)*sp, vy: Math.sin(angle)*sp, r: 4 });
	}
}

function circleRectCollide(cx, cy, cr, rx, ry, rw, rh){
	const nearestX = Math.max(rx, Math.min(cx, rx + rw));
	const nearestY = Math.max(ry, Math.min(cy, ry + rh));
	const dx = cx - nearestX; const dy = cy - nearestY;
	return (dx*dx + dy*dy) <= cr*cr;
}

// --- Update loop ---
function update(){
	frame++;

	// follow mouse X/Y (if enabled) - smooth interpolation
	if (followEnabled){
		const W = canvas.width / devicePixelRatio;
		const H = canvas.height / devicePixelRatio;
		const targetX = clamp(mouseX, 20, W - 20);
		const targetY = clamp(mouseY, player.r, H - player.r);
		const lerp = 0.16;
		// compute dy for tilt feedback
		const dy = (targetY - player.y) * lerp;
		player.x += (targetX - player.x) * lerp;
		player.y += dy;
		player.vy = dy; // used for tilt
	}
	const W = canvas.width / devicePixelRatio;
	const H = canvas.height / devicePixelRatio;

	// spawn enemies
	const spawnRate = Math.max(60, 120 - Math.floor(score * 1.2));
	if (frame % spawnRate === 0) spawnEnemy();

	// spawn life plane occasionally (rarer)
	if (frame % 900 === 0) spawnLifePlane();

	// auto-fire by player
	// attackSpeed increases by 0.1 every 5 points (1.0, 1.1, 1.2, ...)
	const attackSpeed = 1.0 + 0.1 * Math.floor(score / 5);
	const fireRate = Math.max(6, Math.round(baseFireInterval / attackSpeed));
	if (frame % fireRate === 0 && running) firePlayerBullet();

	// spawn boss every 10 points (only once per milestone)
	if (score > 0 && score % 10 === 0 && lastBossScore !== score) {
		spawnBoss();
		lastBossScore = score;
	}

		// update player bullets (move upward)
	for (let i = playerBullets.length - 1; i >= 0; i--){
		const b = playerBullets[i];
		if (b.vx) b.x += b.vx;
		if (b.vy) b.y += b.vy;
		if (b.y < -20 || b.x < -50 || b.x > W + 50) { playerBullets.splice(i,1); continue; }
		// collision with enemies
		for (let j = enemies.length - 1; j >= 0; j--){
			const e = enemies[j];
				if (circleRectCollide(b.x, b.y, b.r, e.x - e.w/2, e.y - e.h/2, e.w, e.h)){
					// boss takes HP with 1.5s invulnerability after hit
					if (e.isBoss){
						if (!e.invulnerable){
							e.hp -= 1;
							// set 1.5 second invulnerability (approx 90 frames)
							e.invulnerable = true;
							e.invTimer = 90;
							// trigger special hit pattern
							fireBossHitPattern(e);
							playerBullets.splice(i,1);
							if (e.hp <= 0){ enemies.splice(j,1); score += 3; }
						} else {
							// still remove the bullet but do not damage
							playerBullets.splice(i,1);
						}
					} else {
						enemies.splice(j,1); playerBullets.splice(i,1); score++;
					}
					break;
				}
		}
	}

	// update enemies
	for (let i = enemies.length - 1; i >= 0; i--){
		const e = enemies[i];
		// vertical movement
		e.y += e.vy;
		// horizontal oscillation only for enemies that have pattern params
		if (typeof e.amp !== 'undefined' && typeof e.freq !== 'undefined' && typeof e.phase !== 'undefined'){
			e.x = e.ox + Math.sin((frame * e.freq) + e.phase) * e.amp;
		} else {
			e.x = e.ox; // boss or static enemy
		}
		e.shootTimer--;
		// handle invulnerability timer for boss
		if (e.isBoss && e.invulnerable){
			e.invTimer--;
			if (e.invTimer <= 0){ e.invulnerable = false; e.invTimer = 0; }
		}
		// boss special shooting
		if (e.isBoss){
			if (e.shootTimer <= 0){ fireBoss360(e); e.shootTimer = 140 + Math.floor(Math.random()*120); }
		} else {
			// shooting behaviors for normal enemies
			if (e.shootType === 'single') {
				if (e.shootTimer <= 0) { fireEnemyBullet(e); e.shootTimer = 60 + Math.floor(Math.random()*100); }
			} else if (e.shootType === 'fast') {
				if (e.shootTimer <= 0) { fireEnemyBullet(e); e.shootTimer = 18 + Math.floor(Math.random()*40); }
			} else if (e.shootType === 'burst') {
				if (e.shootTimer <= 0) { e.burstLeft = 3 + Math.floor(Math.random()*3); e.shootTimer = 200 + Math.floor(Math.random()*200); }
				if (e.burstLeft > 0 && frame % 8 === 0) { fireEnemyBullet(e); e.burstLeft--; }
			}
		}
		if (e.y > H + 40) enemies.splice(i,1);
		// collision with player
		if (circleRectCollide(player.x, player.y, player.r, e.x - e.w/2, e.y - e.h/2, e.w, e.h)){
			// hitting a normal enemy reduces HP by 1 (boss handled via bullets)
			if (e.isBoss){
				// direct collision with boss is heavy damage
				if (!player.invulnerable){ player.hp -= 2; player.invulnerable = true; player.invTimer = 90; createHitEffect(); }
			} else {
					if (!player.invulnerable){ player.hp -= 1; player.invulnerable = true; player.invTimer = 90; createHitEffect(); }
				enemies.splice(i,1);
			}
		}
	}

	// update enemy bullets
	for (let i = enemyBullets.length - 1; i >= 0; i--){
		const b = enemyBullets[i];
		if (b.vx) b.x += b.vx; // support vx/vy spread bullets
		if (b.vy) b.y += b.vy;
		if (b.y > H + 20 || b.x < -50 || b.x > W + 50) { enemyBullets.splice(i,1); continue; }
		const dx = b.x - player.x; const dy = b.y - player.y;
		if (dx*dx + dy*dy < (b.r + player.r)*(b.r + player.r)){
			// player takes damage unless invulnerable
			if (!player.invulnerable){
				player.hp -= 1;
				player.invulnerable = true;
				player.invTimer = 90; // 1.5s invul
				createHitEffect();
			}
			enemyBullets.splice(i,1);
		}
	}

	// update life planes
	for (let i = lifePlanes.length - 1; i >= 0; i--){
		const lp = lifePlanes[i]; lp.y += lp.vy;
		if (lp.y > H + 30) { lifePlanes.splice(i,1); continue; }
		if (circleRectCollide(player.x, player.y, player.r, lp.x - lp.w/2, lp.y - lp.h/2, lp.w, lp.h)){
			// collect life
			player.hp = Math.min(player.maxHp, player.hp + 1);
			lifePlanes.splice(i,1);
		}
	}

	// update player effects (hit rings, particles)
	for (let i = playerEffects.length - 1; i >= 0; i--){
		const ef = playerEffects[i];
		ef.life--;
		if (ef.life <= 0) playerEffects.splice(i,1);
	}

	// player invulnerability timer
	if (player.invulnerable){
		player.invTimer--;
		if (player.invTimer <= 0){ player.invulnerable = false; player.invTimer = 0; }
	}

	// clamp HP and handle game over when hearts are all gone
	if (player.hp <= 0) {
		player.hp = 0;
		gameOver = true;
		running = false;
		overlay.innerText = 'Game Over — 클릭(또는 터치)하여 다시 시작';
		overlay.style.display = 'block';
	}

	if (gameOver) running = false;
}


// --- Draw loop ---
function draw(){
	ctx.clearRect(0,0,canvas.width,canvas.height);
	const W = canvas.width / devicePixelRatio;
	const H = canvas.height / devicePixelRatio;

	// sky
	ctx.fillStyle = '#bbe657'; ctx.fillRect(0,0,W,H);

	// enemies
	for (const e of enemies){
		if (e.isBoss) {
			// boss rendering with invulnerability visual cue
			if (e.invulnerable) ctx.globalAlpha = 0.45;
			ctx.fillStyle = '#7b2b6c'; ctx.fillRect(e.x - e.w/2, e.y - e.h/2, e.w, e.h);
			ctx.fillStyle = '#4a1640'; ctx.fillRect(e.x - e.w/2 - 6, e.y - 2, 12, 6);
			if (e.invulnerable) ctx.globalAlpha = 1.0;
			// HP bar (use e.maxHp)
			const hpMax = e.maxHp || (5 + Math.floor(score/5));
			ctx.fillStyle = '#222'; ctx.fillRect(e.x - 40, e.y - e.h/2 - 12, 80, 8);
			ctx.fillStyle = '#ff6b6b'; ctx.fillRect(e.x - 40, e.y - e.h/2 - 12, Math.max(0, 80 * (e.hp / hpMax)), 8);
		} else {
			ctx.fillStyle = '#2b6cb0'; ctx.fillRect(e.x - e.w/2, e.y - e.h/2, e.w, e.h);
			ctx.fillStyle = '#184b73'; ctx.fillRect(e.x - e.w/2 - 6, e.y - 2, 6, 4);
		}
	}

		// player bullets
		ctx.fillStyle = '#c212a5'; for (const b of playerBullets){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); }
		// enemy bullets
		ctx.fillStyle = '#0c10eb'; for (const b of enemyBullets){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); }

		// life planes (green)
		for (const lp of lifePlanes){
			ctx.fillStyle = '#29a745'; ctx.fillRect(lp.x - lp.w/2, lp.y - lp.h/2, lp.w, lp.h);
			ctx.fillStyle = '#1f7a34'; ctx.fillRect(lp.x - lp.w/2 - 4, lp.y - 2, 6, 4);
		}

		// player hit effects (rings)
		for (const ef of playerEffects){
			const t = 1 - (ef.life / ef.maxLife); // 0 -> 1
			const r = ef.startR + t * (ef.endR - ef.startR);
			ctx.beginPath();
			ctx.strokeStyle = ef.color;
			ctx.lineWidth = 3 * (1 - t) + 1;
			ctx.globalAlpha = 0.9 * (1 - t);
			ctx.arc(ef.x, ef.y, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = 1.0;
		}

		// player (triangle) - green life plane look
		ctx.save(); ctx.translate(player.x, player.y); const tilt = clamp(-player.vy * 0.06, -0.6, 0.6); ctx.rotate(tilt);
		if (player.invulnerable) ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#e00ecf'; ctx.beginPath(); ctx.moveTo(-player.r, -player.r); ctx.lineTo(-player.r, player.r); ctx.lineTo(player.r, 0); ctx.closePath(); ctx.fill();
		if (player.invulnerable) ctx.globalAlpha = 1.0;
		ctx.restore();

		// draw hearts (top-left)
		const heartSize = 18;
		for (let i=0;i<player.maxHp;i++){
			const hx = 12 + i * (heartSize + 6);
			const hy = 8;
			if (i < player.hp){
				ctx.fillStyle = '#ff6b6b'; ctx.font = '18px sans-serif'; ctx.fillText('❤', hx, hy + heartSize - 4);
			} else {
				ctx.globalAlpha = 0.25; ctx.fillStyle = '#ff6b6b'; ctx.font = '18px sans-serif'; ctx.fillText('❤', hx, hy + heartSize - 4); ctx.globalAlpha = 1.0;
			}
		}

		// HUD
		ctx.fillStyle = '#052433'; ctx.font = '18px sans-serif'; ctx.fillText('Score: ' + score, W - 120, 28);
}

function loop(){ if (running){ update(); draw(); if (!running){ overlay.innerText = 'Game Over — 클릭(또는 터치)하여 다시 시작'; overlay.style.display = 'block'; } else requestAnimationFrame(loop); } }

// --- Input handling ---
canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mouseX = e.clientX - r.left; mouseY = e.clientY - r.top; });
canvas.addEventListener('mousedown', ()=>{});
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect(); mouseX = t.clientX - r.left; mouseY = t.clientY - r.top; }, {passive:false});
window.addEventListener('touchmove', (e)=>{ const t = e.touches[0]; const r = canvas.getBoundingClientRect(); mouseX = t.clientX - r.left; mouseY = t.clientY - r.top; }, {passive:false});


// overlay start/restart
overlay.style.display = 'block';
overlay.innerText = 'Start';
overlay.addEventListener('click', ()=>{
	if (!running && !gameOver){ followEnabled = true; running = true; overlay.style.display = 'none'; loop(); }
	else if (gameOver){ reset(); followEnabled = true; running = true; overlay.style.display = 'none'; loop(); }
});

// initialize
reset(); draw();

