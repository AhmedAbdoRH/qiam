// بنك الأسئلة - الأسئلة الافتراضية
const defaultQuestions: string[] = [
  "ما هو أكثر شيء تحبه في نفسك؟",
  "ما هو الشعور الذي تتمنى أن تعيشه أكثر؟",
  "ما الذي يجعلك تشعر بالأمان؟",
  "كيف تعبّر عن حبك لنفسك؟",
  "ما هو الحلم الذي لم تخبر به أحداً؟",
  "ما الذي تحتاجه الآن ولا تطلبه؟",
  "متى كانت آخر مرة شعرت فيها بسعادة حقيقية؟",
  "ما الشيء الذي تود أن تسامح نفسك عليه؟",
  "ما هو أجمل ذكرى تحتفظ بها؟",
  "لو استطعت أن ترسل رسالة لنفسك قبل سنة، ماذا ستقول؟",
];

const STORAGE_KEY = 'qa-question-bank';

export function getQuestionBank(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaultQuestions;
}

export function setQuestionBank(questions: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function addQuestionsFromText(text: string): string[] {
  const newQuestions = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
  
  if (newQuestions.length === 0) return getQuestionBank();
  
  const current = getQuestionBank();
  const merged = [...current, ...newQuestions.filter(q => !current.includes(q))];
  setQuestionBank(merged);
  return merged;
}

export function removeQuestion(index: number): string[] {
  const current = getQuestionBank();
  current.splice(index, 1);
  setQuestionBank(current);
  return [...current];
}

export function resetQuestionBank(): string[] {
  localStorage.removeItem(STORAGE_KEY);
  return defaultQuestions;
}
