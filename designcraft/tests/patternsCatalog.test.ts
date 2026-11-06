import test from "node:test";
import assert from "node:assert/strict";
import {
  PATTERNS_CATALOG,
  PATTERN_CATEGORIES,
} from "../src/data/patternsCatalog";

test("patterns catalog provides 60+ unique seamless SVG patterned backgrounds across valid categories", () => {
  assert.ok(
    PATTERNS_CATALOG.length >= 60,
    `Expected at least 60 patterned backgrounds, got ${PATTERNS_CATALOG.length}`,
  );
  const validCategories = new Set(
    PATTERN_CATEGORIES.map((c) => c.id).filter((id) => id !== "all"),
  );
  const seenIds = new Set<string>();
  const seenSources = new Set<string>();

  for (const item of PATTERNS_CATALOG) {
    assert.ok(item.id && !seenIds.has(item.id), `Duplicate or empty id: ${item.id}`);
    seenIds.add(item.id);
    assert.ok(item.name.trim().length > 2, `Missing English name on ${item.id}`);
    assert.ok(item.nameAr.trim().length > 2, `Missing Arabic name on ${item.id}`);
    assert.ok(validCategories.has(item.category), `Invalid category ${item.category} on ${item.id}`);
    assert.equal(item.type, "svg-pattern");
    assert.ok(
      item.sourceUrl.startsWith("data:image/svg+xml;utf8,"),
      `Expected inline SVG tile on ${item.id}`,
    );
    assert.ok(
      !seenSources.has(item.sourceUrl),
      `Duplicate SVG artwork on ${item.id}`,
    );
    seenSources.add(item.sourceUrl);
  }
});
