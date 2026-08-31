import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_TASK_TYPES = new Set([
  "grammar",
  "grammar_test",
  "vocabulary",
  "kanji",
  "reading",
  "listening",
  "daily_test",
  "weekly_test",
  "monthly_test",
  "end_test",
  "mock_test",
]);

const ALLOWED_TEST_TYPES = new Set(["grammar", "daily", "weekly", "monthly", "end", "mock"]);

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findJsonFiles(entryPath)));
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(entryPath);
  }

  return files;
}

function addDuplicateErrors(values, label, file, errors) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${file}: duplicate ${label} '${value}'`);
    seen.add(value);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function validateOptionalStringArray(value, field, file, itemId, errors) {
  if (!Object.hasOwn(value ?? {}, field)) return;
  if (!Array.isArray(value[field]) || value[field].some((entry) => !isNonEmptyString(entry))) {
    errors.push(`${file}: Kanji item '${itemId}' ${field} must be an array of non-empty strings`);
  }
}

function validateKanjiItem(item, file, errors) {
  const itemId = item?.id ?? "<unknown>";
  if (!Number.isInteger(item?.id) || item.id < 1) {
    errors.push(`${file}: Kanji item '${itemId}' id must be a positive integer`);
  }
  for (const field of ["kanji", "han_viet", "meaning_vi"]) {
    if (!isNonEmptyString(item?.[field])) {
      errors.push(`${file}: Kanji item '${itemId}' ${field} must be a non-empty string`);
    }
  }

  for (const field of ["onyomi", "kunyomi", "notes_vi"]) {
    validateOptionalStringArray(item, field, file, itemId, errors);
  }

  if (Object.hasOwn(item ?? {}, "source_ref") && !isNonEmptyString(item.source_ref)) {
    errors.push(`${file}: Kanji item '${itemId}' source_ref must be a non-empty string`);
  }

  if (Object.hasOwn(item ?? {}, "compounds")) {
    if (!Array.isArray(item.compounds)) {
      errors.push(`${file}: Kanji item '${itemId}' compounds must be an array`);
    } else {
      item.compounds.forEach((compound, index) => {
        if (!isNonEmptyString(compound?.word) ||
            !isNonEmptyString(compound?.reading) ||
            !isNonEmptyString(compound?.meaning_vi)) {
          errors.push(`${file}: Kanji item '${itemId}' compound ${index} requires non-empty word, reading, and meaning_vi`);
        }
      });
    }
  }

  if (Object.hasOwn(item ?? {}, "examples")) {
    if (!Array.isArray(item.examples)) {
      errors.push(`${file}: Kanji item '${itemId}' examples must be an array`);
    } else {
      item.examples.forEach((example, index) => {
        if (!isNonEmptyString(example?.jp) ||
            !isNonEmptyString(example?.reading) ||
            !isNonEmptyString(example?.vi)) {
          errors.push(`${file}: Kanji item '${itemId}' example ${index} requires non-empty jp, reading, and vi`);
        }
      });
    }
  }
}

function validateStudyDay(document, file, errors) {
  if (
    Object.hasOwn(document, "study_day") &&
    (!Number.isInteger(document.study_day) || document.study_day < 1 || document.study_day > 100)
  ) {
    errors.push(`${file}: study_day must be an integer from 1 to 100`);
  }
}

function validateRoadmap(document, file, errors) {
  if (!Array.isArray(document.days)) return;

  const dayNumbers = document.days.map((day) => day.day);
  addDuplicateErrors(dayNumbers, "Study Day", file, errors);

  if (document.days.length !== 100 || dayNumbers.some((day) => !Number.isInteger(day) || day < 1 || day > 100)) {
    errors.push(`${file}: roadmap must contain Study Days 1 through 100 exactly once`);
  }

  for (const day of document.days) {
    if (!Array.isArray(day.tasks)) continue;
    addDuplicateErrors(day.tasks.map((task) => task.order), `task order on Day ${day.day}`, file, errors);
    addDuplicateErrors(day.tasks.map((task) => task.task_id), `task_id on Day ${day.day}`, file, errors);
    for (const task of day.tasks) {
      if (!ALLOWED_TASK_TYPES.has(task.type)) {
        errors.push(`${file}: unsupported task type '${task.type}' on Day ${day.day}`);
      }
    }
  }
}

function validateLearningPool(document, file, errors) {
  const isVocabulary = document.id?.startsWith("vocabulary-");
  const isKanji = document.id?.startsWith("kanji-");
  if (!isVocabulary && !isKanji) return;

  if (!Array.isArray(document.items)) {
    if (isKanji) errors.push(`${file}: kanji items must be an array`);
    return;
  }
  addDuplicateErrors(document.items.map((item) => item.id), "item id", file, errors);

  if (isVocabulary) {
    if (document.target !== 50) errors.push(`${file}: vocabulary target must equal 50`);
    if (document.items.length > 100) errors.push(`${file}: vocabulary pool cannot exceed 100 items`);
    if (document.pool_size !== document.items.length) errors.push(`${file}: pool_size must equal items.length`);
    for (const item of document.items) {
      if (!isNonEmptyString(item?.hiragana)) {
        errors.push(`${file}: vocabulary item '${item?.id}' hiragana must be a non-empty string`);
      }
      if (item?.kanji !== null && !isNonEmptyString(item?.kanji)) {
        errors.push(`${file}: vocabulary item '${item?.id}' kanji must be a non-empty string or null`);
      }
      if (Object.hasOwn(item ?? {}, "surface") && !isNonEmptyString(item.surface)) {
        errors.push(`${file}: vocabulary item '${item?.id}' surface must be a non-empty string`);
      }
    }
  }

  if (isKanji) {
    if (document.items.length < 1) errors.push(`${file}: kanji items must contain at least one item`);
    for (const item of document.items) validateKanjiItem(item, file, errors);
  }
}

function validateQuestionItems(items, label, questionId, file, errors) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${file}: Reading question '${questionId}' ${label} must be a non-empty array`);
    return null;
  }
  if (items.some((item) => !isNonEmptyString(item?.id) || !isNonEmptyString(item?.text))) {
    errors.push(`${file}: Reading question '${questionId}' ${label} require non-empty id and text`);
    return null;
  }
  const ids = items.map((item) => item.id);
  if (hasDuplicates(ids)) {
    errors.push(`${file}: Reading question '${questionId}' ${label} IDs must be unique`);
  }
  return ids;
}

function validateReadingQuestion(question, file, errors) {
  const questionId = isNonEmptyString(question?.id) ? question.id : "<unknown>";
  if (!isNonEmptyString(question?.id)) errors.push(`${file}: Reading question id must be non-empty`);
  if (!isNonEmptyString(question?.question_jp)) {
    errors.push(`${file}: Reading question '${questionId}' question_jp must be non-empty`);
  }

  const questionType = question?.question_type ?? "mcq";
  if (questionType === "mcq") {
    const optionIds = validateQuestionItems(question?.options, "options", questionId, file, errors);
    if (!isNonEmptyString(question?.correct_option_id) || !optionIds?.includes(question.correct_option_id)) {
      errors.push(`${file}: Reading MCQ '${questionId}' correct_option_id must reference an option`);
    }
    return;
  }
  if (questionType === "true_false") {
    if (typeof question?.correct_answer !== "boolean") {
      errors.push(`${file}: Reading true_false '${questionId}' correct_answer must be boolean`);
    }
    return;
  }
  if (questionType === "short_answer") {
    if (!Array.isArray(question?.accepted_answers) || question.accepted_answers.length === 0) {
      errors.push(`${file}: Reading short_answer '${questionId}' accepted_answers must be non-empty`);
      return;
    }
    if (question.accepted_answers.some((answer) => !isNonEmptyString(answer))) {
      errors.push(`${file}: Reading short_answer '${questionId}' accepted_answers must contain non-empty strings`);
      return;
    }
    const normalized = question.accepted_answers.map((answer) => answer.normalize("NFC").trim());
    if (hasDuplicates(normalized)) {
      errors.push(`${file}: Reading short_answer '${questionId}' accepted_answers must be unique after normalization`);
    }
    return;
  }
  if (questionType !== "matching") {
    errors.push(`${file}: unsupported Reading question_type '${questionType}'`);
    return;
  }

  const leftIds = validateQuestionItems(question?.left_items, "left_items", questionId, file, errors);
  const rightIds = validateQuestionItems(question?.right_items, "right_items", questionId, file, errors);
  if (!leftIds || !rightIds || !Array.isArray(question?.correct_pairs)) {
    if (!Array.isArray(question?.correct_pairs)) {
      errors.push(`${file}: Reading matching '${questionId}' correct_pairs must be an array`);
    }
    return;
  }
  const leftMappings = question.correct_pairs.map((pair) => pair?.left_id);
  const rightMappings = question.correct_pairs.map((pair) => pair?.right_id);
  if (question.correct_pairs.some((pair) => !leftIds.includes(pair?.left_id) || !rightIds.includes(pair?.right_id))) {
    errors.push(`${file}: Reading matching '${questionId}' correct_pairs must reference known IDs`);
  }
  if (hasDuplicates(leftMappings)) {
    errors.push(`${file}: Reading matching '${questionId}' cannot map a left item more than once`);
  }
  if (hasDuplicates(rightMappings)) {
    errors.push(`${file}: Reading matching '${questionId}' cannot reuse a right item`);
  }
  if (leftMappings.length !== leftIds.length || leftIds.some((leftId) => !leftMappings.includes(leftId))) {
    errors.push(`${file}: Reading matching '${questionId}' must map every left item exactly once`);
  }
}

function validateReading(document, file, errors) {
  if (!document.id?.startsWith("reading-") || !Array.isArray(document.items)) return;
  for (const item of document.items) {
    if (item?.questions === null) continue;
    if (!Array.isArray(item?.questions)) {
      errors.push(`${file}: Reading item '${item?.id}' questions must be an array or null`);
      continue;
    }
    const questionIds = item.questions.map((question) => question?.id);
    if (hasDuplicates(questionIds)) {
      errors.push(`${file}: Reading item '${item?.id}' question IDs must be unique`);
    }
    for (const question of item.questions) validateReadingQuestion(question, file, errors);
  }
}

function validateTest(document, file, errors) {
  if (!Array.isArray(document.sections)) return;

  if (!ALLOWED_TEST_TYPES.has(document.type)) {
    errors.push(`${file}: unsupported test type '${document.type}'`);
  }

  const questions = document.sections.flatMap((section) =>
    Array.isArray(section.questions) ? section.questions : [],
  );
  addDuplicateErrors(questions.map((question) => question.id), "question id", file, errors);

  if (document.type === "grammar") {
    const grammarSection = document.sections.find((section) => section?.id === "grammar");
    const grammarQuestions = Array.isArray(grammarSection?.questions)
      ? grammarSection.questions
      : [];
    const lessonGroups = Array.isArray(document.lesson_groups) ? document.lesson_groups : [];
    const groupedQuestionIds = lessonGroups.flatMap((group) =>
      Array.isArray(group?.question_ids) ? group.question_ids : [],
    );
    const questionIds = questions.map((question) => question.id);

    if (questions.length !== 25 || grammarQuestions.length !== 25) {
      errors.push(`${file}: grammar test must contain exactly 25 questions`);
    }
    if (document.sections.length !== 1 || !grammarSection) {
      errors.push(`${file}: grammar test must contain exactly one 'grammar' section`);
    }
    if (grammarSection?.max_score !== 25) {
      errors.push(`${file}: grammar test max_score must equal 25`);
    }
    if (questions.some((question) => question.category !== "grammar")) {
      errors.push(`${file}: every grammar test question must use category 'grammar'`);
    }
    if (
      document.coverage?.from_day !== document.study_day ||
      document.coverage?.to_day !== document.study_day
    ) {
      errors.push(`${file}: grammar test coverage must equal its study_day`);
    }
    if (lessonGroups.length !== 5) {
      errors.push(`${file}: grammar test must contain exactly 5 lesson_groups`);
    }
    addDuplicateErrors(lessonGroups.map((group) => group?.lesson), "lesson number", file, errors);
    for (const group of lessonGroups) {
      if (!Array.isArray(group?.question_ids) || group.question_ids.length !== 5) {
        errors.push(`${file}: every grammar test lesson_group must contain 5 question_ids`);
      }
    }
    addDuplicateErrors(groupedQuestionIds, "lesson-group question id", file, errors);
    if (
      groupedQuestionIds.length !== 25 ||
      [...groupedQuestionIds].sort().join("\0") !== [...questionIds].sort().join("\0")
    ) {
      errors.push(`${file}: lesson_groups must reference every grammar question exactly once`);
    }
  }

  if (document.type !== "daily") return;

  const requiredCounts = new Map([
    ["grammar", 15],
    ["vocabulary", 15],
    ["kanji", 15],
  ]);

  for (const [sectionId, expected] of requiredCounts) {
    const section = document.sections.find((candidate) => candidate.id === sectionId);
    const actual = Array.isArray(section?.questions) ? section.questions.length : 0;
    if (actual !== expected) errors.push(`${file}: daily ${sectionId} section must contain ${expected} questions`);
  }

  if (questions.length !== 45) errors.push(`${file}: daily test must contain exactly 45 questions`);
}

function validateDocument(document, file, errors) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    errors.push(`${file}: root value must be a JSON object`);
    return;
  }

  if (document.schema_version !== 1) errors.push(`${file}: schema_version must equal 1`);
  validateStudyDay(document, file, errors);
  validateRoadmap(document, file, errors);
  validateLearningPool(document, file, errors);
  validateReading(document, file, errors);
  validateTest(document, file, errors);
}

export async function validateContentRoot(contentRoot) {
  const errors = [];
  const files = await findJsonFiles(contentRoot);

  for (const file of files) {
    try {
      const document = JSON.parse(await readFile(file, "utf8"));
      validateDocument(document, path.relative(contentRoot, file), errors);
    } catch (error) {
      errors.push(`${path.relative(contentRoot, file)}: invalid JSON (${error.message})`);
    }
  }

  return { filesChecked: files.length, errors };
}

async function main() {
  const contentRoot = path.resolve(process.cwd(), "content");
  const result = await validateContentRoot(contentRoot);

  if (result.errors.length > 0) {
    console.error(`Content validation failed with ${result.errors.length} error(s):`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Content validation passed (${result.filesChecked} JSON file(s) checked).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
