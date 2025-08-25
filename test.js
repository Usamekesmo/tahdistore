// ==================================================================
// =================== ملف test.js (النسخة النهائية) ================
// ==================================================================
// يحتوي هذا الملف على كل المنطق المتعلق بإنشاء وتقديم الاختبارات للمستخدم.

import * as UI from './ui.js';

// --- 1. متغيرات حالة الاختبار الداخلية ---
let testQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userOrderSelection = []; // لتخزين إجابات أسئلة الترتيب
let selectedButtons = []; // لتخزين الأزرار المختارة في أسئلة الترتيب

// --- 2. دوال إدارة حالة الاختبار ---

/**
 * إعادة تعيين حالة الاختبار لبدء اختبار جديد.
 */
export function resetTestState() {
    testQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    userOrderSelection = [];
    selectedButtons = [];
}

/**
 * الحصول على نتائج الاختبار النهائية.
 * @returns {{score: number, totalQuestions: number}}
 */
export function getTestResults() {
    return { score, totalQuestions: testQuestions.length };
}

// --- 3. دوال توليد الأسئلة ---

// هذه الدوال (create...) تبقى كما هي لأنها تعتمد على منطق جافاسكريبت بحت
// ولا تتفاعل مباشرة مع قاعدة البيانات.

function createCompleteAyahQuestion(sourceAyahs) {
    let randomAyah, words;
    let attempts = 0;
    do {
        randomAyah = sourceAyahs[Math.floor(Math.random() * sourceAyahs.length)];
        words = randomAyah.text.split(/\s+/);
        if(attempts++ > 50) throw new Error("آيات غير كافية لسؤال إكمال.");
    } while (words.length < 7);
    const firstPart = words.slice(0, 5).join(" ");
    const correctAnswer = words.slice(5).join(" ");
    const options = [correctAnswer];
    let wrongAyah;
    do {
        wrongAyah = sourceAyahs[Math.floor(Math.random() * sourceAyahs.length)];
    } while (wrongAyah.text === randomAyah.text);
    const wrongAnswer = wrongAyah.text.split(/\s+/).slice(5).join(" ");
    if (wrongAnswer.length > 3) options.push(wrongAnswer);
    else options.push(wrongAyah.text);
    options.sort(() => Math.random() - 0.5);
    return { type: 'complete_ayah', questionText: `اختر التكملة الصحيحة للآية: "${firstPart}..."`, options, answer: correctAnswer, page: randomAyah.page };
}

function createOrderWordsQuestion(sourceAyahs) {
    let randomAyah, words;
    let attempts = 0;
    do {
        randomAyah = sourceAyahs[Math.floor(Math.random() * sourceAyahs.length)];
        words = randomAyah.text.split(/\s+/).filter(w => w.length > 0);
        if(attempts++ > 50) throw new Error("آيات غير كافية لسؤال ترتيب كلمات.");
    } while (words.length < 5 || words.length > 10);
    const correctAnswer = randomAyah.text;
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    if (shuffledWords.join(" ") === correctAnswer) [shuffledWords[0], shuffledWords[1]] = [shuffledWords[1], shuffledWords[0]];
    return { type: 'order_words', questionText: `رتب الكلمات التالية لتكوين آية صحيحة:`, shuffledWords, answer: correctAnswer, page: randomAyah.page };
}

/**
 * يولد أسئلة الاختبار بناءً على الآيات المتاحة والإعدادات.
 * @param {Array} sourceAyahs - مصفوفة الآيات المتاحة.
 * @param {Array} selectedTypes - أنواع الأسئلة المحددة.
 * @param {number} questionCount - عدد الأسئلة المطلوب.
 */
export async function generateTestQuestions(sourceAyahs, selectedTypes, questionCount) {
    testQuestions = [];
    if (!sourceAyahs || sourceAyahs.length < 3) return;

    let attempts = 0;
    while (testQuestions.length < questionCount && attempts < 100) {
        const randomType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
        let question = null;
        try {
            if (randomType === 'complete_ayah') question = createCompleteAyahQuestion(sourceAyahs);
            else if (randomType === 'order_words') question = createOrderWordsQuestion(sourceAyahs);
            // يمكن إضافة أنواع أسئلة أخرى هنا
        } catch (error) {
            console.warn(`فشل إنشاء سؤال ${randomType}:`, error.message);
        }
        if (question && !testQuestions.some(q => q.questionText === question.questionText)) {
            testQuestions.push(question);
        }
        attempts++;
    }
}

// --- 4. دوال عرض الاختبار والتحقق من الإجابات ---

function handleOrderSelection(button) {
    if (button.classList.contains('selected')) {
        const index = selectedButtons.indexOf(button);
        if (index > -1) {
            selectedButtons.splice(index, 1);
            userOrderSelection.splice(index, 1);
            button.classList.remove('selected');
            // تحديث أرقام الأزرار المتبقية
            selectedButtons.forEach((btn, i) => {
                btn.textContent = `${i + 1}. ${btn.dataset.text}`;
            });
        }
    } else {
        button.classList.add('selected');
        userOrderSelection.push(button.dataset.text);
        selectedButtons.push(button);
        button.textContent = `${userOrderSelection.length}. ${button.dataset.text}`;
    }
}

function checkAnswer(selectedOption = null) {
    const question = testQuestions[currentQuestionIndex];
    let userAnswer, correctAnswer, isCorrect;
    const normalize = (str) => str.replace(/[\s\u064B-\u0652]/g, "");

    if (question.type.startsWith('order')) {
        userAnswer = userOrderSelection.join(" ");
        correctAnswer = Array.isArray(question.answer) ? question.answer.join(" ") : question.answer;
        isCorrect = normalize(userAnswer) === normalize(correctAnswer);
    } else {
        userAnswer = selectedOption;
        correctAnswer = question.answer;
        isCorrect = normalize(userAnswer) === normalize(correctAnswer);
    }

    if (isCorrect) {
        score++;
        UI.questionContainer.classList.add('correct-answer-bg');
    } else {
        UI.questionContainer.classList.add('wrong-answer-bg');
        const finalAnswerText = Array.isArray(question.answer) ? question.answer.join('\n') : question.answer;
        UI.questionContainer.innerHTML += `<p style="color: green; margin-top: 10px; white-space: pre-wrap;"><strong>الإجابة الصحيحة:</strong>\n${finalAnswerText}</p>`;
    }

    UI.submitAnswerButton.style.display = 'none';
    UI.optionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    UI.nextQuestionButton.style.display = 'block';

    // إطلاق حدث مخصص لإعلام main.js بنتيجة الإجابة
    const event = new CustomEvent('answer-checked', { detail: { question, isCorrect } });
    document.dispatchEvent(event);
}

export function displayQuestion() {
    if (currentQuestionIndex >= testQuestions.length) {
        // إطلاق حدث مخصص لإعلام main.js بانتهاء الاختبار
        const event = new CustomEvent('test-finished');
        document.dispatchEvent(event);
        return;
    }

    userOrderSelection = [];
    selectedButtons = [];
    const question = testQuestions[currentQuestionIndex];
    UI.questionContainer.classList.remove('correct-answer-bg', 'wrong-answer-bg');
    UI.questionTitle.textContent = `السؤال ${currentQuestionIndex + 1} من ${testQuestions.length}`;
    UI.progressBar.style.width = `${(currentQuestionIndex / testQuestions.length) * 100}%`;
    UI.optionsContainer.innerHTML = '';
    UI.questionContainer.innerHTML = `<p>${question.questionText}</p>`;
    UI.submitAnswerButton.style.display = 'none';

    if (question.type === 'complete_ayah') {
        UI.optionsContainer.style.display = 'grid';
        question.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option;
            button.onclick = () => checkAnswer(option);
            UI.optionsContainer.appendChild(button);
        });
    } else if (question.type === 'order_words') {
        UI.optionsContainer.style.display = 'flex';
        UI.optionsContainer.style.flexWrap = 'wrap';
        UI.optionsContainer.style.justifyContent = 'center';
        question.shuffledWords.forEach(itemText => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = itemText;
            button.dataset.text = itemText;
            button.onclick = () => handleOrderSelection(button);
            UI.optionsContainer.appendChild(button);
        });
        UI.submitAnswerButton.style.display = 'block';
        UI.submitAnswerButton.onclick = () => checkAnswer();
    }
    UI.nextQuestionButton.style.display = 'none';
}

/**
 * الانتقال إلى السؤال التالي.
 */
export function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}


