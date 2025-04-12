// Wrap the entire sketch in a function for instance mode
const sketch = (p) => {

    // Game state variable
    let gameState = 'nameInput'; // 'nameInput', 'start', 'game', 'gameOver'

    // Player Name variable
    let playerName = "";
    const maxNameLength = 10;

    // Game variables
    let score = 0;
    let runner;
    let obstacles = [];
    let gameSpeed = 5;
    let baseGameSpeed = 5;
    let speedIncreaseFactor = 0.0015;

    // Background variables - UPDATED Dawn/Sunset Colors
    let bgLayers = [];
    const groundHeight = 60;
    const skyColor = [210, 110, 120]; // Muted pink/orange sky
    const groundColor = [100, 90, 90]; // Warmer gray pavement

    // Obstacle spawning timer
    let obstacleInterval = 90; // Base interval
    let obstacleTimer = 0;

    // Gravity constant
    const gravity = 0.6;

    // =============================================================
    // GAME OBJECT CLASSES
    // =============================================================

    class RunnerCharacter {
        // --- RunnerCharacter class remains the same ---
        constructor() {
            this.bodyW = 20; this.bodyH = 35; this.headSize = 12;
            this.legW = 6; this.legH = 15; this.armW = 5; this.armH = 15;
            this.w = this.bodyW; this.h = this.bodyH + this.headSize;
            this.x = 60; this.y = p.height ? p.height - groundHeight - this.h : 100;
            this.vy = 0; this.jumpForce = -11.5; this.isGrounded = true;
            this.legPhase = 0; this.armPhase = 0;
        }
        jump() { if (this.isGrounded) { this.vy = this.jumpForce; this.isGrounded = false; } }
        update(gravityParam, groundLevel) {
            this.vy += gravityParam; this.y += this.vy;
            let floorPos = p.height - groundLevel - this.h;
            if (this.y >= floorPos) { this.y = floorPos; this.vy = 0; this.isGrounded = true; }
            else { this.isGrounded = false; }
            if (this.isGrounded && p.frameCount % 8 === 0) { this.legPhase = 1 - this.legPhase; this.armPhase = 1 - this.armPhase; }
        }
        show() {
            p.push(); p.translate(this.x, this.y); p.noStroke();
            const suitColor = p.color(10, 10, 10); // Black suit
            const skinColor = p.color(240, 220, 180); const shirtColor = p.color(250, 250, 250);
            p.fill(skinColor); p.rect(this.bodyW * 0.5 - this.headSize * 0.5, 0, this.headSize, this.headSize, 2);
            p.fill(suitColor); p.rect(0, this.headSize, this.bodyW, this.bodyH, 2);
            p.fill(shirtColor); p.rect(this.bodyW * 0.3, this.headSize, this.bodyW * 0.4, 4);
            p.fill(suitColor); let legY = this.headSize + this.bodyH;
            if (this.isGrounded) {
                if (this.legPhase === 0) { p.rect(this.bodyW * 0.1, legY, this.legW, this.legH, 1); p.rect(this.bodyW * 0.9 - this.legW, legY, this.legW, this.legH * 0.9, 1); }
                else { p.rect(this.bodyW * 0.1, legY, this.legW, this.legH * 0.9, 1); p.rect(this.bodyW * 0.9 - this.legW, legY, this.legW, this.legH, 1); }
            } else { p.rect(this.bodyW * 0.1, legY, this.legW, this.legH * 0.8, 1); p.rect(this.bodyW * 0.9 - this.legW, legY, this.legW, this.legH * 0.8, 1); }
            p.fill(suitColor); let armY = this.headSize + 5;
            if (this.armPhase === 0) { p.rect(this.bodyW * 0.05, armY, this.armW, this.armH, 1); p.rect(this.bodyW * 0.95 - this.armW, armY, this.armW, this.armH * 0.8, 1); }
            else { p.rect(this.bodyW * 0.05, armY, this.armW, this.armH * 0.8, 1); p.rect(this.bodyW * 0.95 - this.armW, armY, this.armW, this.armH, 1); }
            p.pop();
        }
    }

    class Obstacle {
        // --- Obstacle class remains the same ---
         constructor(groundLevel) {
            const types = ['cab', 'bin', 'rat', 'policeCar', 'shrub']; this.type = p.random(types);
            this.color = p.color(200); this.detailColor = p.color(50); this.detailColor2 = p.color(200, 0, 0);
            switch (this.type) {
                case 'cab': this.h = 35; this.w = 60; this.color = p.color(255, 215, 0); this.detailColor = p.color(50); this.detailColor2 = p.color(150); break;
                case 'bin': this.h = p.random([30, 45]); this.w = this.h * p.random(0.6, 0.8); this.color = p.color(p.random(80, 120), p.random(90, 130), p.random(80, 120)); this.detailColor = p.color(p.red(this.color)*0.7, p.green(this.color)*0.7, p.blue(this.color)*0.7); break;
                case 'rat': this.h = 15; this.w = 25; this.color = p.color(80, 75, 70); this.detailColor = p.color(40, 35, 30); break;
                case 'policeCar': this.h = 38; this.w = 65; this.color = p.color(240, 240, 255); this.detailColor = p.color(0, 0, 150); this.detailColor2 = p.color(50); break;
                case 'shrub': let ph = 20; let th = p.random(10, 20); let fh = p.random(20, 35); this.h = ph + th + fh; this.w = p.max(25, fh * 0.6); this.planterColor = p.color(100, 80, 70); this.trunkColor = p.color(139, 69, 19); this.foliageColor = p.color(34, 139, 34); this.planterH = ph; this.trunkH = th; this.foliageH = fh; this.foliageW = this.w; break;
            } this.x = p.width; this.y = p.height - groundLevel - this.h;
        }
        update(speed) { this.x -= speed; } isOffscreen() { return this.x + this.w < 0; }
        hits(runnerToCheck) {
            if (!runnerToCheck) return false; let rX = runnerToCheck.x + 2, rY = runnerToCheck.y + 2, rW = runnerToCheck.w - 4, rH = runnerToCheck.h - 4; let oX = this.x, oY = this.y, oW = this.w, oH = this.h;
            if (this.type === 'rat') { oY = this.y + this.h * 0.3; oH = this.h * 0.7; }
            return ( rX < oX + oW && rX + rW > oX && rY < oY + oH && rY + rH > oY );
        }
        show() {
            p.push(); p.translate(this.x, this.y); p.noStroke();
            switch (this.type) {
                case 'cab': p.fill(this.color); p.rect(0, 0, this.w, this.h, 3); p.fill(this.detailColor); let wc = 8; p.rect(this.w*0.15,this.h-wc*0.5,wc,wc); p.rect(this.w*0.7,this.h-wc*0.5,wc,wc); p.fill(this.detailColor2); p.rect(this.w*0.4,-3,this.w*0.2,5,1); break;
                case 'bin': p.fill(this.color); p.beginShape(); p.vertex(0,this.h); p.vertex(this.w,this.h); p.vertex(this.w*0.9,0); p.vertex(this.w*0.1,0); p.endShape(p.CLOSE); p.fill(this.detailColor); p.rect(this.w*0.1,0,this.w*0.8,4,1); p.rect(this.w*0.4,this.h*0.2,this.w*0.2,this.h*0.1); break;
                case 'rat': p.fill(this.color); p.ellipse(this.w*0.5,this.h*0.6,this.w*0.9,this.h*0.8); p.fill(this.detailColor); p.rect(-this.w*0.3,this.h*0.5,this.w*0.4,2); p.ellipse(this.w*0.7,this.h*0.5,2,2); break;
                case 'policeCar': p.fill(this.color); p.rect(0,0,this.w,this.h,3); p.fill(this.detailColor); p.rect(0,this.h*0.3,this.w,this.h*0.4); p.fill(this.detailColor2); let wp=9; p.rect(this.w*0.15,this.h-wp*0.5,wp,wp); p.rect(this.w*0.7,this.h-wp*0.5,wp,wp); let lw=8, lh=6; if(p.frameCount%20<10){ p.fill(255,0,0); p.rect(this.w*0.5-lw-1,-lh*0.8,lw,lh,1); p.fill(0,0,255); p.rect(this.w*0.5+1,-lh*0.8,lw,lh,1); } else{ p.fill(0,0,255); p.rect(this.w*0.5-lw-1,-lh*0.8,lw,lh,1); p.fill(255,0,0); p.rect(this.w*0.5+1,-lh*0.8,lw,lh,1); } break;
                case 'shrub': p.fill(this.planterColor); p.rect(this.w * 0.1, this.h - this.planterH, this.w * 0.8, this.planterH, 2); p.fill(this.trunkColor); let trunkW = this.w * 0.3; p.rect(this.w * 0.5 - trunkW * 0.5, this.h - this.planterH - this.trunkH, trunkW, this.trunkH); p.fill(this.foliageColor); p.ellipse(this.w * 0.5, this.foliageH * 0.5, this.foliageW, this.foliageH); break;
            } p.pop();
        }
    }

    // =============================================================
    // P5.JS Instance Functions (Setup, Draw, KeyPressed, Helpers)
    // =============================================================

    p.setup = function() {
        p.createCanvas(800, 400); p.noSmooth(); p.textAlign(p.CENTER, p.CENTER); p.textSize(16);
        // --- Initialize Background Layers - UPDATED Building Colors, REMOVED Stars ---
        // bgLayers.push({ type: 'stars', speedFactor: 0.05, color: p.color(255, 255, 200, 150), elements: createBgElements(150, 1, 3, 0.9, 'star') }); // REMOVED Star Layer
        bgLayers.push({ type: 'building', speedFactor: 0.1, color: p.color(70, 60, 80, 200), elements: createBgElements(10, 150, 300, 0.1, 'building', true) }); // Warmer dark purple/gray
        bgLayers.push({ type: 'building', speedFactor: 0.25, color: p.color(85, 75, 95, 220), elements: createBgElements(12, 100, 250, 0.2, 'building', true) }); // Warmer dark purple/gray
        bgLayers.push({ type: 'building', speedFactor: 0.5, color: p.color(100, 90, 110, 240), elements: createBgElements(15, 50, 200, 0.3, 'building', false) }); // Warmer dark purple/gray
    }

    // UPDATED to only generate buildings
    function createBgElements(count, minSize, maxSize, yVarianceFactor, type = 'building', allowIconic = false) {
        let elements = [];
        for (let i = 0; i < count; i++) {
            let h = p.random(minSize, maxSize);
            let w, yPos, subType = null;

            // Only generating buildings now
            w = p.random(h * 0.1, h * 0.3); // Standard building width
            // Add slight chance for wider building
             if (p.random() < 0.1) {
                 w = p.random(h * 0.3, h * 0.5);
             }

            yPos = p.height - groundHeight - h + p.random(-h * yVarianceFactor, h * yVarianceFactor * 0.1);
            if (allowIconic && p.random() < 0.15) {
                subType = 'spire';
            }

            elements.push({
                type: 'building', // Hardcode type
                subType: subType,
                x: p.random(-p.width * 0.5, p.width * 1.5),
                y: yPos,
                w: w,
                h: h
            });
        } return elements;
    }

    p.draw = function() {
        switch (gameState) {
            case 'nameInput': drawNameInputScreen(); break;
            case 'start': drawStartScreen(); break;
            case 'game': drawGameScreen(); break;
            case 'gameOver': drawGameOverScreen(); break;
        }
    }

    p.keyPressed = function() {
        switch (gameState) {
             case 'nameInput': handleNameInput(p.keyCode, p.key); break;
            case 'start': handleStartInput(p.keyCode); break;
            case 'game': handleGameInput(p.keyCode); break;
            case 'gameOver': handleGameOverInput(p.keyCode); break;
        }
    }

    function resetGame() {
        // --- resetGame remains the same ---
        score = 0; obstacles = []; gameSpeed = baseGameSpeed; obstacleTimer = obstacleInterval / 2;
        if (typeof p.height !== 'undefined') { runner = new RunnerCharacter(); } else { console.error("Cannot create Runner: p.height not defined."); return; }
        bgLayers.forEach(layer => { layer.elements.forEach(el => {
            el.x = p.random(-p.width * 0.5, p.width * 1.5);
            // No need to check for star type anymore
            if (el.type === 'building') { el.y = p.height - groundHeight - el.h; }
        }); });
    }

    // =============================================================
    // STATE-SPECIFIC DRAWING FUNCTIONS
    // =============================================================

     function drawNameInputScreen() {
        // --- drawNameInputScreen remains the same ---
        p.background(skyColor[0] * 0.8, skyColor[1] * 0.8, skyColor[2] * 0.8);
        drawBackgroundLayers(); // Draw static background
        p.fill(0, 0, 0, 150); p.rect(p.width * 0.1, p.height * 0.3, p.width * 0.8, p.height * 0.4, 10);
        p.fill(240, 240, 255); p.textSize(32); p.textAlign(p.CENTER, p.CENTER);
        p.text("Enter Your Name:", p.width / 2, p.height * 0.4);
        p.textSize(40); p.fill(255, 255, 100);
        let nameToShow = playerName; if (p.frameCount % 60 < 30) { nameToShow += "_"; } p.text(nameToShow, p.width / 2, p.height * 0.55);
        p.fill(200); p.textSize(18); p.text(`(Max ${maxNameLength} chars, Press ENTER to continue)`, p.width / 2, p.height * 0.65);
     }

    function drawStartScreen() {
        // --- drawStartScreen remains the same ---
        p.background(skyColor[0], skyColor[1], skyColor[2]); drawBackgroundLayers();
        p.fill(0, 0, 0, 100); p.rect(0,0, p.width, p.height);
        p.fill(240, 240, 255); p.textSize(48); p.textAlign(p.CENTER, p.CENTER);
        p.text("MANHATTAN RUNNER", p.width / 2, p.height / 2 - 60);
        p.textSize(20); p.text("Instructions:", p.width / 2, p.height / 2 + 10);
        p.text("Press [SPACE] to Jump", p.width / 2, p.height / 2 + 40);
        p.textSize(24); p.fill(p.frameCount % 60 < 30 ? p.color(255, 255, 100) : p.color(240, 240, 255));
        p.text("Press [ENTER] to Start", p.width / 2, p.height / 2 + 90);
    }

    function drawGameScreen() {
        // --- drawGameScreen remains the same ---
        updateGameLogic(); p.background(skyColor[0], skyColor[1], skyColor[2]); drawBackgroundLayers();
        p.fill(groundColor[0], groundColor[1], groundColor[2]); p.noStroke(); p.rect(0, p.height - groundHeight, p.width, groundHeight);
        if(obstacles) obstacles.forEach(obs => obs.show()); if(runner) runner.show(); drawHUD();
    }

    function drawGameOverScreen() {
        // --- drawGameOverScreen remains the same ---
        p.background(skyColor[0], skyColor[1], skyColor[2]); drawBackgroundLayers();
        p.fill(groundColor[0], groundColor[1], groundColor[2]); p.noStroke(); p.rect(0, p.height - groundHeight, p.width, groundHeight);
        if(obstacles) obstacles.forEach(obs => obs.show()); if(runner) runner.show();
        p.fill(50, 20, 20, 230); p.rect(p.width*0.1, p.height*0.2, p.width*0.8, p.height*0.6, 10);
        p.fill(255, 200, 200); p.textSize(60); p.textAlign(p.CENTER, p.CENTER); p.text("GAME OVER", p.width / 2, p.height * 0.35);
        p.fill(240, 240, 255); p.textSize(24); p.text(playerName || "Runner", p.width / 2, p.height * 0.48);
        p.textSize(30); p.text("Final Score: " + p.floor(score), p.width / 2, p.height * 0.58);
        p.textSize(24); p.fill(p.frameCount % 60 < 30 ? p.color(255, 255, 100) : p.color(240, 240, 255));
        p.text("Press [ENTER] to Play Again", p.width / 2, p.height * 0.7);
    }

    // =============================================================
    // STATE-SPECIFIC LOGIC / INPUT HANDLING
    // =============================================================
    // --- Input handling functions remain the same ---
     function handleNameInput(kCode, k) {
         if (kCode === p.BACKSPACE) { if (playerName.length > 0) { playerName = playerName.substring(0, playerName.length - 1); } }
         else if (kCode === p.ENTER) { if (playerName.length === 0) { playerName = "Runner"; } gameState = 'start'; }
         else if (playerName.length < maxNameLength) { const validCharRegex = /^[a-zA-Z0-9 ]$/; if (validCharRegex.test(k)) { playerName += k; } }
     }
    function handleStartInput(kCode) { if (kCode === p.ENTER) { resetGame(); gameState = 'game'; } }
    function handleGameInput(kCode) { if (runner && kCode === 32) { runner.jump(); } }
    function handleGameOverInput(kCode) { if (kCode === p.ENTER) { resetGame(); gameState = 'game'; } }

    // --- updateGameLogic remains the same ---
    function updateGameLogic() {
        if (!runner) return; score += 0.1; gameSpeed += speedIncreaseFactor; runner.update(gravity, groundHeight);
        obstacleTimer--; if (obstacleTimer <= 0) { spawnObstacle(); let nextSpawn = p.random(0.8, 1.2) * obstacleInterval * (baseGameSpeed / gameSpeed); obstacleTimer = p.max(45, p.floor(nextSpawn)); }
        for (let i = obstacles.length - 1; i >= 0; i--) { obstacles[i].update(gameSpeed); if (obstacles[i].hits(runner)) { gameState = 'gameOver'; return; } if (obstacles[i].isOffscreen()) { obstacles.splice(i, 1); } }
        // Only scroll background if game is running
        if (gameState === 'game') { bgLayers.forEach(layer => { layer.elements.forEach(el => {
            el.x -= gameSpeed * layer.speedFactor; if (el.x + el.w < 0) { el.x = p.width + p.random(50, 150); /* No star check needed */ if (el.type === 'building') { el.y = p.height - groundHeight - el.h; } }
        }); }); }
    }

    // *** UPDATED to remove window drawing logic ***
     function drawBackgroundLayers() {
        p.noStroke();
        bgLayers.forEach(layer => {
            p.fill(layer.color); // Use updated building colors
            layer.elements.forEach(el => {
                // Only drawing buildings now
                if (el.type === 'building') {
                    // Base rectangle
                    p.rect(el.x, el.y, el.w, el.h);

                    // Draw spire if iconic
                    if (el.subType === 'spire') {
                        p.fill(layer.color); // Ensure spire is same color
                        let spireBaseWidth = el.w * 0.6; let spireHeight = el.h * 0.3; let spireBaseY = el.y - spireHeight;
                        p.triangle( el.x + el.w * 0.5, spireBaseY - spireHeight * 0.5, el.x + el.w * 0.5 - spireBaseWidth * 0.5, spireBaseY + spireHeight * 0.5, el.x + el.w * 0.5 + spireBaseWidth * 0.5, spireBaseY + spireHeight * 0.5 );
                        p.rect(el.x + el.w * 0.5 - 1, spireBaseY - spireHeight * 0.7, 2, spireHeight*0.2); // Antenna
                    }
                }
                 // Removed star drawing logic
                 // Removed window drawing logic
            });
        });
    }

    // --- spawnObstacle and drawHUD remain the same ---
    function spawnObstacle() { if (typeof Obstacle !== 'undefined') { obstacles.push(new Obstacle(groundHeight)); } else { console.error("Obstacle class not defined for spawning."); } }
    function drawHUD() {
        p.fill(0, 0, 0, 150); p.noStroke(); p.rect(0, 0, p.width, 30); p.fill(255); p.textSize(18);
        p.textAlign(p.LEFT, p.TOP); p.text("Score: " + p.floor(score), 10, 5);
        p.textAlign(p.CENTER, p.TOP); p.text("Press [SPACE] to Jump", p.width / 2, 5);
    }

}; // End of sketch function wrapper

// Create the p5 instance and run the sketch
new p5(sketch);

