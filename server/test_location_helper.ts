
const { processLocation } = require('./src/utils/locationHelper');

async function runTests() {
    console.log("--- Testing processLocation ---");

    // Test 1: Coordinates only
    try {
        const res1 = await processLocation({ latitude: 10, longitude: 20 });
        const pass1 = res1?.coordinates[0] === 20 && res1?.coordinates[1] === 10;
        console.log("Test 1 (Coords only):", pass1 ? "PASS" : "FAIL", res1);
    } catch (e) {
        console.error("Test 1 Error:", e);
    }

    // Test 2: Both (Coords should win)
    try {
        const res2 = await processLocation({ latitude: 50, longitude: 60, address: "Valid Address" });
        const pass2 = res2?.coordinates[0] === 60 && res2?.coordinates[1] === 50;
        console.log("Test 2 (Both):", pass2 ? "PASS" : "FAIL", res2);
    } catch (e) {
        console.error("Test 2 Error:", e);
    }

    // Test 3: Missing data
    try {
        const res3 = await processLocation({});
        const pass3 = res3 === undefined;
        console.log("Test 3 (Empty):", pass3 ? "PASS" : "FAIL", res3);
    } catch (e) {
        console.error("Test 3 Error:", e);
    }

    // Test 4: Address only (Might fail due to real geocoder or missing config, but let's see)
    // We expect undefined or a result, not a crash.
    try {
        const res4 = await processLocation({ address: "New York" });
        console.log("Test 4 (Address only): Result:", res4);
    } catch (e: any) {
        console.log("Test 4 (Address only): Failed gracefully (Expected if no API key/network):", e.message);
    }

    console.log("--- Tests Completed ---");
}

runTests();
