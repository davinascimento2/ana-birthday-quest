const { chromium } = require('@playwright/test');

async function runEmpiricalAudit() {
    console.log('=== STARTING EMPIRICAL CHALLENGER M1 AUDIT ===');
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        hasTouch: true
    });

    const page = await context.newPage();

    const consoleLogs = [];
    const consoleWarnings = [];
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            consoleErrors.push(text);
        } else if (type === 'warning') {
            consoleWarnings.push(text);
        } else {
            consoleLogs.push(`[${type}] ${text}`);
        }
    });

    page.on('pageerror', err => {
        pageErrors.push(err.message || String(err));
    });

    page.on('requestfailed', req => {
        failedRequests.push({
            url: req.url(),
            failure: req.failure()
        });
    });

    page.on('response', res => {
        if (res.status() >= 400) {
            failedRequests.push({
                url: res.url(),
                status: res.status()
            });
        }
    });

    console.log('Navigating to http://127.0.0.1:31425/...');
    await page.goto('http://127.0.0.1:31425/');
    await page.waitForLoadState('domcontentloaded');

    // Click start game
    const startBtn = page.locator('#btn-start-game');
    await startBtn.waitFor({ state: 'visible', timeout: 5000 });
    await startBtn.click();
    console.log('Clicked #btn-start-game');

    // Wait for gameApp and isReady
    await page.waitForFunction(() => !!window.gameApp && !!window.__GAME_STATE__ && window.__GAME_STATE__.isReady === true, { timeout: 10000 });
    console.log('Game app initialized and __GAME_STATE__.isReady is true');

    const contractChecks = [];
    const adversarialFindings = [];

    // =========================================================================
    // CONTRACT 1: INITIAL STATE CONTRACTS
    // =========================================================================
    console.log('\n--- CONTRACT 1: Initial State Contracts ---');
    const initial = await page.evaluate(() => {
        const gs = window.__GAME_STATE__;
        const appState = window.gameApp.getState();
        return { gs, appState };
    });

    contractChecks.push({ name: 'isReady === true', pass: initial.gs.isReady === true });
    contractChecks.push({ name: 'currentLevel === 1', pass: initial.gs.currentLevel === 1 });
    contractChecks.push({ name: 'player.x is number', pass: typeof initial.gs.player.x === 'number' && !isNaN(initial.gs.player.x) });
    contractChecks.push({ name: 'player.y is number', pass: typeof initial.gs.player.y === 'number' && !isNaN(initial.gs.player.y) });
    contractChecks.push({ name: 'player.z is number', pass: typeof initial.gs.player.z === 'number' && !isNaN(initial.gs.player.z) });
    contractChecks.push({ name: 'toadbigode.isRevealed === false', pass: initial.gs.toadbigode.isRevealed === false });
    contractChecks.push({ name: 'toadbigode.isHugging === false', pass: initial.gs.toadbigode.isHugging === false });
    contractChecks.push({ name: 'dialogue.isActive === false', pass: initial.gs.dialogue.isActive === false });

    // window.gameApp.getState() contract
    contractChecks.push({ name: 'getState().stage === 1', pass: initial.appState.stage === 1 });
    contractChecks.push({ name: 'getState().inDialogue === false', pass: initial.appState.inDialogue === false });
    contractChecks.push({ name: 'getState().isRevealed === false', pass: initial.appState.isRevealed === false });
    contractChecks.push({ name: 'getState().isHugging === false', pass: initial.appState.isHugging === false });
    contractChecks.push({ name: 'getState().candlesLit === false', pass: initial.appState.candlesLit === false });

    // =========================================================================
    // CONTRACT 2: STAGE WARPS (1 -> 2 -> 3 -> 1)
    // =========================================================================
    console.log('\n--- CONTRACT 2: Stage Warps & Transitions ---');
    for (const targetStage of [2, 3, 1]) {
        await page.evaluate(st => window.gameApp.warpToStage(st), targetStage);
        await page.waitForTimeout(700);

        const warpState = await page.evaluate(() => ({
            level: window.__GAME_STATE__.currentLevel,
            appStage: window.gameApp.getState().stage,
            badge: document.getElementById('stage-badge') ? document.getElementById('stage-badge').innerText : ''
        }));

        contractChecks.push({
            name: `warpToStage(${targetStage}) -> currentLevel === ${targetStage}`,
            pass: warpState.level === targetStage && warpState.appStage === targetStage
        });
        contractChecks.push({
            name: `warpToStage(${targetStage}) -> DOM badge text`,
            pass: warpState.badge.includes(`FASE ${targetStage}`)
        });
    }

    // =========================================================================
    // CONTRACT 3: TOADSWORTH / DAVI REVEAL & HUG
    // =========================================================================
    console.log('\n--- CONTRACT 3: Toadbigode Reveal and Hug ---');
    await page.evaluate(() => window.gameApp.warpToStage(3));
    await page.waitForTimeout(700);

    // Trigger reveal
    await page.evaluate(() => window.gameApp.triggerDaviReveal());
    const revealState = await page.evaluate(() => ({
        toad: window.__GAME_STATE__.toadbigode,
        app: window.gameApp.getState()
    }));
    contractChecks.push({
        name: 'triggerDaviReveal -> toadbigode.isRevealed === true',
        pass: revealState.toad.isRevealed === true && revealState.app.isRevealed === true
    });
    contractChecks.push({
        name: 'triggerDaviReveal -> toadbigode.isHugging === false',
        pass: revealState.toad.isHugging === false && revealState.app.isHugging === false
    });

    // Trigger hug
    await page.evaluate(() => window.gameApp.triggerDaviHug());
    const hugState = await page.evaluate(() => ({
        toad: window.__GAME_STATE__.toadbigode,
        candlesLit: window.__GAME_STATE__.candlesLit,
        app: window.gameApp.getState()
    }));
    contractChecks.push({
        name: 'triggerDaviHug -> toadbigode.isHugging === true',
        pass: hugState.toad.isHugging === true && hugState.app.isHugging === true
    });
    contractChecks.push({
        name: 'triggerDaviHug -> candlesLit === true',
        pass: hugState.candlesLit === true && hugState.app.candlesLit === true
    });

    // =========================================================================
    // CONTRACT 4: DIALOGUE CONTRACT & SYNCHRONIZATION
    // =========================================================================
    console.log('\n--- CONTRACT 4: Dialogue State Contract ---');
    await page.evaluate(() => window.dialogueSystem.startDialogue('stage1_intro'));
    const dActive = await page.evaluate(() => ({
        isActive: window.__GAME_STATE__.dialogue.isActive,
        appInDialogue: window.gameApp.getState().inDialogue
    }));
    contractChecks.push({
        name: 'dialogue start -> dialogue.isActive === true',
        pass: dActive.isActive === true && dActive.appInDialogue === true
    });

    // Close dialogue
    await page.evaluate(() => window.dialogueSystem.closeDialogue());
    const dClosed = await page.evaluate(() => ({
        isActive: window.__GAME_STATE__.dialogue.isActive,
        appInDialogue: window.gameApp.getState().inDialogue
    }));
    contractChecks.push({
        name: 'dialogue close -> dialogue.isActive === false',
        pass: dClosed.isActive === false && dClosed.appInDialogue === false
    });

    // =========================================================================
    // CONTRACT 5: CONSOLE HEALTH AUDIT
    // =========================================================================
    console.log('\n--- CONTRACT 5: Console Health Audit ---');
    contractChecks.push({
        name: 'Console Errors === 0',
        pass: consoleErrors.length === 0,
        detail: consoleErrors
    });
    contractChecks.push({
        name: 'Console Warnings === 0',
        pass: consoleWarnings.length === 0,
        detail: consoleWarnings
    });
    contractChecks.push({
        name: 'Page Errors === 0',
        pass: pageErrors.length === 0,
        detail: pageErrors
    });
    contractChecks.push({
        name: 'Failed Network Requests (404/500/failed) === 0',
        pass: failedRequests.length === 0,
        detail: failedRequests
    });

    // =========================================================================
    // ADVERSARIAL STRESS & CORNER CASE TESTS
    // =========================================================================
    console.log('\n--- ADVERSARIAL STRESS & CORNER CASES ---');

    // Stress 1: Missing input validation on warpToStage
    console.log('Stress 1: Input boundary testing on warpToStage...');
    const invalidWarps = await page.evaluate(() => {
        const results = [];
        const testInputs = [0, 4, -1, 'stage_unknown', null, undefined, {}];
        for (const input of testInputs) {
            window.gameApp.warpToStage(input);
            results.push({ input, currentLevel: window.__GAME_STATE__.currentLevel });
        }
        // Restore to valid stage 1
        window.gameApp.warpToStage(1);
        return results;
    });
    console.log('Invalid warps stress results:', invalidWarps);
    const nonContractLevels = invalidWarps.filter(r => ![1, 2, 3].includes(r.currentLevel));
    if (nonContractLevels.length > 0) {
        adversarialFindings.push({
            id: 'CHALLENGE-M1-01',
            severity: 'Low',
            title: 'warpToStage lacks input boundary validation for non-numeric/out-of-range stage arguments',
            description: `warpToStage allows arguments like ${JSON.stringify(nonContractLevels.map(r => r.input))}, corrupting window.__GAME_STATE__.currentLevel to non-contract values. Engine does not crash, but currentLevel departs from 1|2|3 union type.`,
            mitigation: 'Add guard clause in warpToStage: if (![1, 2, 3].includes(stageNum)) return;'
        });
    }

    // Stress 2: Altar Collision in Stage 1
    console.log('Stress 2: Spatial Hash collision against Altar at (960, 380)...');
    await page.evaluate(() => window.gameApp.warpToStage(1));
    await page.waitForTimeout(500);

    const collisionResult = await page.evaluate(() => {
        const engine = window.gameApp.engine;
        // Attempt to teleport directly into the altar center
        engine.player.x = 960;
        engine.player.y = 380;
        // Run 10 physics steps
        for (let i = 0; i < 10; i++) {
            engine.updatePhysics(0.016);
        }
        const dist = Math.hypot(engine.player.x - 960, engine.player.y - 380);
        return {
            finalPos: { x: engine.player.x, y: engine.player.y },
            distFromCenter: dist,
            penetrationPrevented: dist >= 60 // Altar radius is 55, player radius is 16
        };
    });
    console.log('Collision stress result:', collisionResult);
    contractChecks.push({
        name: 'Altar collision prevents player penetration (dist >= 60px)',
        pass: collisionResult.penetrationPrevented
    });

    // Stress 3: Opposing directional key inputs
    console.log('Stress 3: Opposing directional key inputs cancellation...');
    const opposingResult = await page.evaluate(() => {
        const engine = window.gameApp.engine;
        const initialPos = { x: engine.player.x, y: engine.player.y };
        engine.input = { up: true, down: true, left: true, right: true };
        for (let i = 0; i < 30; i++) {
            engine.updatePhysics(0.016);
        }
        const drift = Math.hypot(engine.player.x - initialPos.x, engine.player.y - initialPos.y);
        engine.input = { up: false, down: false, left: false, right: false };
        return { drift, isZeroDrift: drift < 0.001 };
    });
    console.log('Opposing inputs result:', opposingResult);
    contractChecks.push({
        name: 'Simultaneous opposing inputs (W+S, A+D) yield zero drift',
        pass: opposingResult.isZeroDrift
    });

    await browser.close();

    console.log('\n=============================================');
    console.log('           AUDIT VERIFICATION SUMMARY        ');
    console.log('=============================================');
    const passedCount = contractChecks.filter(c => c.pass).length;
    const totalCount = contractChecks.length;
    console.log(`Contract Checks: ${passedCount}/${totalCount} PASSED`);

    contractChecks.forEach((c, idx) => {
        const symbol = c.pass ? '✓' : '✗';
        console.log(`  [${symbol}] ${idx + 1}. ${c.name}`);
        if (!c.pass && c.detail) console.log(`      Detail:`, c.detail);
    });

    console.log(`\nAdversarial Findings: ${adversarialFindings.length}`);
    adversarialFindings.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.severity}] ${f.id}: ${f.title}`);
        console.log(`     Desc: ${f.description}`);
        console.log(`     Mitigation: ${f.mitigation}`);
    });

    if (passedCount === totalCount) {
        console.log('\nOVERALL RESULT: ALL CONTRACT REQUIREMENTS SATISFIED.');
        process.exit(0);
    } else {
        console.error('\nOVERALL RESULT: CONTRACT VIOLATIONS FOUND.');
        process.exit(1);
    }
}

runEmpiricalAudit().catch(err => {
    console.error('Audit failed with error:', err);
    process.exit(2);
});
