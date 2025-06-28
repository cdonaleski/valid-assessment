// Test resume functionality
console.log("Testing resume functionality...");
const testToken = "TEST-TOKEN-123";
const testEmail = "test@example.com";

// Create test progress data
const testProgress = {
    token: testToken,
    email: testEmail,
    timestamp: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    state: {
        currentQuestion: 5,
        answers: { "DT-01": 4, "DT-02": 5 },
        demographics: { email: testEmail, department: "IT", role: "Developer" },
        startTime: new Date().toISOString()
    }
};

// Save test progress
const existingData = JSON.parse(localStorage.getItem("valid_assessment_progress") || "{}");
existingData[testToken] = testProgress;
localStorage.setItem("valid_assessment_progress", JSON.stringify(existingData));

console.log("Test progress saved:", testProgress);
console.log("You can now test resume with token:", testToken, "and email:", testEmail);
