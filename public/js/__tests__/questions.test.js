import QuestionManager from '../questions.js';
import validAssessmentData from '../questions-data.js';

describe('QuestionManager', () => {
    let questionManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        questionManager = new QuestionManager();
    });

    test('initializes with correct questions from questions-data.js', () => {
        expect(questionManager.questions.length).toBe(validAssessmentData.questions.length);
        expect(questionManager.questions[0].text).toBe(validAssessmentData.questions[0].text);
    });

    test('getCurrentQuestion returns the correct question', async () => {
        const question = await questionManager.getCurrentQuestion();
        expect(question).toBeDefined();
        expect(question.id).toBe('DT-01');
        expect(question.text).toBe('When facing an important choice, I start by gathering facts and data.');
    });

    test('nextQuestion advances to the next question', async () => {
        const firstQuestion = await questionManager.getCurrentQuestion();
        await questionManager.nextQuestion();
        const secondQuestion = await questionManager.getCurrentQuestion();
        
        expect(secondQuestion.id).toBe('DT-02');
        expect(questionManager.currentQuestionIndex).toBe(1);
    });

    test('previousQuestion moves to the previous question', async () => {
        await questionManager.nextQuestion();
        const secondQuestion = await questionManager.getCurrentQuestion();
        await questionManager.previousQuestion();
        const firstQuestion = await questionManager.getCurrentQuestion();
        
        expect(firstQuestion.id).toBe('DT-01');
        expect(questionManager.currentQuestionIndex).toBe(0);
    });

    test('saveAnswer stores answer correctly', async () => {
        await questionManager.initializeSession('test-session');
        await questionManager.saveAnswer(5);
        
        const currentQuestion = await questionManager.getCurrentQuestion();
        const answer = questionManager.getAnswer(currentQuestion.id);
        expect(answer).toBe(5);
    });

    test('calculateScores computes correct category scores', async () => {
        await questionManager.initializeSession('test-session');
        
        // Answer first question (Verity category) with score of 5
        await questionManager.saveAnswer(5);
        
        const scores = questionManager.calculateScores();
        expect(scores.V).toBe(5); // First question is Verity category
    });

    test('validates response values correctly', () => {
        expect(questionManager.validateResponse(1)).toBe(true);
        expect(questionManager.validateResponse(7)).toBe(true);
        expect(questionManager.validateResponse(0)).toBe(false);
        expect(questionManager.validateResponse(8)).toBe(false);
        expect(questionManager.validateResponse('invalid')).toBe(false);
    });
}); 