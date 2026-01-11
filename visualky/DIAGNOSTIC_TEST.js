/**
 * DIAGNOSTIC TEST - Run this to see what's actually happening
 * 
 * HOW TO USE:
 * 1. Open browser console (F12)
 * 2. Paste this entire code
 * 3. Press Enter
 * 4. Tell me what you see
 */

console.log('🔍 DIAGNOSTIC TEST STARTING...\n');

// Test 1: Check if multiEngineVision exists
console.log('TEST 1: Checking multiEngineVision...');
import('./services/multiEngineVision.js').then(module => {
    console.log('✅ multiEngineVision module loaded:', module);
    console.log('   - Has analyzeImage?', typeof module.multiEngineVision?.analyzeImage);
    console.log('   - Has initialize?', typeof module.multiEngineVision?.initialize);
    console.log('   - Has getEngineStatus?', typeof module.multiEngineVision?.getEngineStatus);
}).catch(err => {
    console.error('❌ Failed to load multiEngineVision:', err);
});

// Test 2: Check if aiIntegration is using it
console.log('\nTEST 2: Checking aiIntegration...');
import('./services/aiIntegration.js').then(module => {
    console.log('✅ aiIntegration module loaded:', module);
    console.log('   - Has analyzeFrame?', typeof module.analyzeFrame);
    console.log('   - Has initializeAISystem?', typeof module.initializeAISystem);
}).catch(err => {
    console.error('❌ Failed to load aiIntegration:', err);
});

// Test 3: Try to analyze a test image
console.log('\nTEST 3: Testing actual analysis...');
setTimeout(async () => {
    try {
        const { analyzeFrame } = await import('./services/aiIntegration.js');

        // Create a simple test image (1x1 red pixel)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1, 1);
        const testImage = canvas.toDataURL('image/jpeg');

        console.log('   Calling analyzeFrame with test image...');
        const result = await analyzeFrame(testImage);

        console.log('✅ Analysis completed!');
        console.log('   Result:', result);
        console.log('   Analysis text:', result.analysis);
        console.log('   Mode:', result.mode);
        console.log('   Confidence:', result.confidence);

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        console.error('   Error details:', error.message);
        console.error('   Stack:', error.stack);
    }
}, 2000);

console.log('\n🔍 DIAGNOSTIC TEST COMPLETE - Check results above\n');
