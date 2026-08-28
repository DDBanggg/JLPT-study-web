import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  }
}

function validateLearningPool(document, file, errors) {
  if (!Array.isArray(document.items)) return;
  addDuplicateErrors(document.items.map((item) => item.id), "item id", file, errors);

  if (document.id?.startsWith("vocabulary-")) {
    if (document.target !== 50) errors.push(`${file}: vocabulary target must equal 50`);
    if (document.items.length > 100) errors.push(`${file}: vocabulary pool cannot exceed 100 items`);
    if (document.pool_size !== document.items.length) errors.push(`${file}: pool_size must equal items.length`);
  }

  if (document.id?.startsWith("kanji-")) {
    if (document.target !== 30) errors.push(`${file}: kanji target must equal 30`);
    if (document.items.length > 100) errors.push(`${file}: kanji pool cannot exceed 100 items`);
    if (document.pool_size !== document.items.length) errors.push(`${file}: pool_size must equal items.length`);
  }
}

function validateTest(document, file, errors) {
  if (!Array.isArray(document.sections)) return;

  const questions = document.sections.flatMap((section) =>
    Array.isArray(section.questions) ? section.questions : [],
  );
  addDuplicateErrors(questions.map((question) => question.id), "question id", file, errors);

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
