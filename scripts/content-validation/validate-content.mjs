import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PUBLIC_ROOT = path.join(REPO_ROOT, "public");
const READING_ASSET_ROOT = "/reading/assets/";
const READING_ASSET_EXTENSION = /\.(?:png|jpe?g|webp)$/;

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

function validateReadingAssetPath(value, label, file, errors, assetPaths) {
  let decodedValue;
  try {
    decodedValue = typeof value === "string" ? decodeURIComponent(value) : "";
  } catch {
    decodedValue = "";
  }

  const relativePath = decodedValue.startsWith(READING_ASSET_ROOT)
    ? decodedValue.slice(READING_ASSET_ROOT.length)
    : "";
  const segments = relativePath.split("/");
  const isValid = isNonEmptyString(value) &&
    value.startsWith(READING_ASSET_ROOT) &&
    !value.includes("\\") && !value.includes("?") && !value.includes("#") &&
    !decodedValue.includes("..") && !decodedValue.includes("\\") &&
    !decodedValue.includes("?") && !decodedValue.includes("#") &&
    segments.length > 0 &&
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..") &&
    READING_ASSET_EXTENSION.test(value);

  if (!isValid) {
    errors.push(`${file}: ${label} must be a valid Reading asset path under ${READING_ASSET_ROOT}`);
    return false;
  }
  assetPaths.add(value);
  return true;
}

function validateQuestionItems(items, label, questionId, file, errors, assetPaths) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${file}: Reading question '${questionId}' ${label} must be a non-empty array`);
    return null;
  }

  let valid = true;
  for (const [index, item] of items.entries()) {
    const optionLabel = `Reading question '${questionId}' ${label}[${index}]`;
    if (!isNonEmptyString(item?.id)) {
      errors.push(`${file}: ${optionLabel} id must be non-empty`);
      valid = false;
    }
    const hasText = Object.hasOwn(item ?? {}, "text");
    const hasImage = Object.hasOwn(item ?? {}, "image_src");
    if (!hasText && !hasImage) {
      errors.push(`${file}: ${optionLabel} requires text or image_src`);
      valid = false;
    }
    if (hasText && !isNonEmptyString(item.text)) {
      errors.push(`${file}: ${optionLabel} text must be non-empty when present`);
      valid = false;
    }
    if (hasImage && !validateReadingAssetPath(
      item.image_src,
      `${optionLabel} image_src`,
      file,
      errors,
      assetPaths,
    )) {
      valid = false;
    }
  }

  if (!valid) return null;
  const ids = items.map((item) => item.id);
  if (hasDuplicates(ids)) {
    errors.push(`${file}: Reading question '${questionId}' ${label} IDs must be unique`);
  }
  return ids;
}

function validateReadingQuestion(question, file, errors, assetPaths) {
  const questionId = isNonEmptyString(question?.id) ? question.id : "<unknown>";
  if (!isNonEmptyString(question?.id)) errors.push(`${file}: Reading question id must be non-empty`);
  if (!isNonEmptyString(question?.question_jp)) {
    errors.push(`${file}: Reading question '${questionId}' question_jp must be non-empty`);
  }

  const questionType = question?.question_type ?? "mcq";
  if (questionType === "mcq") {
    const optionIds = validateQuestionItems(
      question?.options,
      "options",
      questionId,
      file,
      errors,
      assetPaths,
    );
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

  const leftIds = validateQuestionItems(
    question?.left_items,
    "left_items",
    questionId,
    file,
    errors,
    assetPaths,
  );
  const rightIds = validateQuestionItems(
    question?.right_items,
    "right_items",
    questionId,
    file,
    errors,
    assetPaths,
  );
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

function validateReadingMedia(media, itemId, file, errors, assetPaths) {
  if (!Array.isArray(media)) {
    errors.push(`${file}: Reading item '${itemId}' media must be an array`);
    return [];
  }

  const mediaIds = [];
  for (const [index, item] of media.entries()) {
    const mediaLabel = `Reading item '${itemId}' media[${index}]`;
    const allowedFields = new Set(["id", "type", "src", "alt"]);
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${file}: ${mediaLabel} must be an object`);
      continue;
    }
    if (Object.keys(item).some((field) => !allowedFields.has(field))) {
      errors.push(`${file}: ${mediaLabel} contains unsupported fields`);
    }
    if (!isNonEmptyString(item.id)) {
      errors.push(`${file}: ${mediaLabel} id must be non-empty`);
    } else {
      mediaIds.push(item.id);
    }
    if (item.type !== "image") {
      errors.push(`${file}: ${mediaLabel} type must equal 'image'`);
    }
    validateReadingAssetPath(item.src, `${mediaLabel} src`, file, errors, assetPaths);
    if (Object.hasOwn(item, "alt") && !isNonEmptyString(item.alt)) {
      errors.push(`${file}: ${mediaLabel} alt must be non-empty when present`);
    }
  }
  if (hasDuplicates(mediaIds)) {
    errors.push(`${file}: Reading item '${itemId}' media IDs must be unique`);
  }
  return media;
}

function validateReading(document, file, errors, assetPaths) {
  if (!document.id?.startsWith("reading-") || !Array.isArray(document.items)) return;
  for (const item of document.items) {
    const itemId = item?.id ?? "<unknown>";
    const hasPassage = isNonEmptyString(item?.passage_jp);
    if (Object.hasOwn(item ?? {}, "passage_jp") && item.passage_jp !== null && !hasPassage) {
      errors.push(`${file}: Reading item '${itemId}' passage_jp must be non-empty when present`);
    }

    let media = [];
    if (Object.hasOwn(item ?? {}, "media")) {
      media = validateReadingMedia(item.media, itemId, file, errors, assetPaths);
    }
    if (!hasPassage && media.length === 0) {
      errors.push(`${file}: Reading item '${itemId}' requires non-empty passage_jp or media`);
    }

    if (Object.hasOwn(item ?? {}, "translation_vi") && item.translation_vi !== null) {
      if (!isNonEmptyString(item.translation_vi)) {
        errors.push(`${file}: Reading item '${itemId}' translation_vi must be non-empty when present`);
      } else if (!hasPassage) {
        errors.push(`${file}: Reading item '${itemId}' translation_vi requires passage_jp`);
      }
    }

    if (!Object.hasOwn(item ?? {}, "questions") || item.questions === null) continue;
    if (!Array.isArray(item?.questions)) {
      errors.push(`${file}: Reading item '${item?.id}' questions must be an array or null`);
      continue;
    }
    const questionIds = item.questions.map((question) => question?.id);
    if (hasDuplicates(questionIds)) {
      errors.push(`${file}: Reading item '${item?.id}' question IDs must be unique`);
    }
    for (const question of item.questions) validateReadingQuestion(question, file, errors, assetPaths);
  }
}

async function validateReadingAssets(assetPaths, publicRoot, file, errors) {
  const resolvedPublicRoot = path.resolve(publicRoot);
  for (const assetPath of assetPaths) {
    const decodedAssetPath = decodeURIComponent(assetPath);
    const resolvedAsset = path.resolve(resolvedPublicRoot, decodedAssetPath.slice(1));
    const relativeAsset = path.relative(resolvedPublicRoot, resolvedAsset);
    if (relativeAsset.startsWith("..") || path.isAbsolute(relativeAsset)) {
      errors.push(`${file}: Reading asset '${assetPath}' resolves outside publicRoot`);
      continue;
    }
    try {
      if (!(await stat(resolvedAsset)).isFile()) {
        errors.push(`${file}: Reading asset '${assetPath}' does not exist under publicRoot`);
      }
    } catch {
      errors.push(`${file}: Reading asset '${assetPath}' does not exist under publicRoot`);
    }
  }
}

function validateDailyQuestion(
  question,
  expectedCategory,
  expectedId,
  coveredDay,
  sourceItemIds,
  file,
  errors,
) {
  const label = `daily question '${question?.id ?? "<unknown>"}'`;
  if (question?.id !== expectedId) {
    errors.push(`${file}: ${label} must use deterministic id '${expectedId}'`);
  }
  if (question?.category !== expectedCategory) {
    errors.push(`${file}: ${label} category must equal '${expectedCategory}'`);
  }
  if (!isNonEmptyString(question?.prompt)) {
    errors.push(`${file}: ${label} prompt must be a non-empty string`);
  }
  if (question?.stimulus_id !== null) {
    errors.push(`${file}: ${label} stimulus_id must equal null`);
  }

  const options = Array.isArray(question?.options) ? question.options : [];
  const expectedOptionIds = ["A", "B", "C", "D"];
  const optionIds = options.map((option) => option?.id);
  if (
    options.length !== expectedOptionIds.length ||
    optionIds.some((id, index) => id !== expectedOptionIds[index])
  ) {
    errors.push(`${file}: ${label} option IDs must be exactly A/B/C/D`);
  }
  if (options.some((option) => !isNonEmptyString(option?.text))) {
    errors.push(`${file}: ${label} option text must be non-empty`);
  }
  if (!isNonEmptyString(question?.correct_option_id) || !optionIds.includes(question.correct_option_id)) {
    errors.push(`${file}: ${label} correct_option_id must reference an option`);
  }

  const references = Array.isArray(question?.source_item_refs) ? question.source_item_refs : [];
  if (references.length === 0) {
    errors.push(`${file}: ${label} source_item_refs must be a non-empty array`);
  }
  if (hasDuplicates(references)) {
    errors.push(`${file}: ${label} source_item_refs must be unique`);
  }
  const expectedPrefix = `${expectedCategory}:`;
  const availableIds = sourceItemIds.get(`${expectedCategory}:${coveredDay}`) ?? new Set();
  for (const reference of references) {
    const match = typeof reference === "string"
      ? /^(grammar|vocabulary|kanji):([1-9][0-9]*)$/.exec(reference)
      : null;
    if (!match) {
      errors.push(`${file}: ${label} has malformed source_item_ref '${reference}'`);
      continue;
    }
    if (!reference.startsWith(expectedPrefix)) {
      errors.push(`${file}: ${label} source_item_ref '${reference}' must match its category`);
      continue;
    }
    if (!availableIds.has(match[2])) {
      errors.push(
        `${file}: ${label} source_item_ref '${reference}' must resolve to ${expectedCategory} Study Day ${coveredDay}`,
      );
    }
  }

  for (const forbiddenField of ["explanation_vi", "translation_vi", "hint", "notes"]) {
    if (Object.hasOwn(question ?? {}, forbiddenField)) {
      errors.push(`${file}: ${label} must not contain ${forbiddenField}`);
    }
  }
}

function validateTest(document, file, errors, sourceItemIds) {
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

  const coveredDay = document.study_day - 1;
  const expectedSections = document.study_day === 2
    ? [
        { id: "grammar", count: 20 },
        { id: "vocabulary", count: 25 },
      ]
    : [
        { id: "grammar", count: 15 },
        { id: "vocabulary", count: 15 },
        { id: "kanji", count: 15 },
      ];

  if (
    document.coverage?.from_day !== coveredDay ||
    document.coverage?.to_day !== coveredDay
  ) {
    errors.push(`${file}: daily test coverage must equal Study Day ${coveredDay}`);
  }
  if (document.sections.length !== expectedSections.length) {
    errors.push(`${file}: daily test must contain exactly ${expectedSections.length} sections`);
  }

  let questionNumber = 1;
  expectedSections.forEach((expectedSection, sectionIndex) => {
    const section = document.sections[sectionIndex];
    if (section?.id !== expectedSection.id) {
      errors.push(`${file}: daily section ${sectionIndex + 1} must be '${expectedSection.id}'`);
    }
    if (section?.max_score !== expectedSection.count) {
      errors.push(
        `${file}: daily ${expectedSection.id} section max_score must equal ${expectedSection.count}`,
      );
    }
    const sectionQuestions = Array.isArray(section?.questions) ? section.questions : [];
    if (sectionQuestions.length !== expectedSection.count) {
      errors.push(
        `${file}: daily ${expectedSection.id} section must contain ${expectedSection.count} questions`,
      );
    }
    for (const question of sectionQuestions) {
      validateDailyQuestion(
        question,
        expectedSection.id,
        `q${String(questionNumber).padStart(3, "0")}`,
        coveredDay,
        sourceItemIds,
        file,
        errors,
      );
      questionNumber += 1;
    }
  });

  if (questions.length !== 45) errors.push(`${file}: daily test must contain exactly 45 questions`);
}

function validateDocument(document, file, errors, assetPaths, sourceItemIds) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    errors.push(`${file}: root value must be a JSON object`);
    return;
  }

  if (document.schema_version !== 1) errors.push(`${file}: schema_version must equal 1`);
  validateStudyDay(document, file, errors);
  validateRoadmap(document, file, errors);
  validateLearningPool(document, file, errors);
  validateReading(document, file, errors, assetPaths);
  validateTest(document, file, errors, sourceItemIds);
}

export async function validateContentRoot(contentRoot, options = {}) {
  const errors = [];
  const files = await findJsonFiles(contentRoot);
  const publicRoot = typeof options === "string"
    ? options
    : options.publicRoot ?? DEFAULT_PUBLIC_ROOT;

  const parsedDocuments = [];
  for (const file of files) {
    try {
      const document = JSON.parse(await readFile(file, "utf8"));
      parsedDocuments.push({ document, file, relativeFile: path.relative(contentRoot, file) });
    } catch (error) {
      errors.push(`${path.relative(contentRoot, file)}: invalid JSON (${error.message})`);
    }
  }

  const sourceItemIds = new Map();
  for (const { document } of parsedDocuments) {
    for (const category of ["grammar", "vocabulary", "kanji"]) {
      if (
        document?.id === `${category}-day-${String(document.study_day).padStart(3, "0")}` &&
        Array.isArray(document.items)
      ) {
        sourceItemIds.set(
          `${category}:${document.study_day}`,
          new Set(document.items.map((item) => String(item?.id))),
        );
      }
    }
  }

  for (const { document, relativeFile } of parsedDocuments) {
    try {
      const assetPaths = new Set();
      validateDocument(document, relativeFile, errors, assetPaths, sourceItemIds);
      await validateReadingAssets(assetPaths, publicRoot, relativeFile, errors);
    } catch (error) {
      errors.push(`${relativeFile}: validation failed (${error.message})`);
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
