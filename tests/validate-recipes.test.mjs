import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateCollection } from '../scripts/validate-recipes.mjs';

const valid = `---
title: Quick pasta
summary: A dependable supper.
prep_time: 10 min
cook_time: 20 min
servings: 4
tags:
  - main
  - weeknight
---

## Ingredients

- 400 g pasta

## Method

1. Boil the pasta.
`;

async function collection(recipe = valid, name = 'quick-pasta.md') {
	const directory = await mkdtemp(join(tmpdir(), 'recipes-'));
	await writeFile(join(directory, name), recipe);
	return directory;
}

test('accepts a valid Recipe', async () => {
	assert.deepEqual(await validateCollection(await collection()), []);
});

for (const [name, recipe, filename, rule] of [
	['filename', valid, 'Quick Pasta.md', 'lowercase-kebab-case filename'],
	['unknown field', valid.replace('title:', 'Author: Me\ntitle:'), 'quick-pasta.md', 'unknown front-matter field'],
	['array field', valid.replace('title: Quick pasta', 'title: [Quick pasta]'), 'quick-pasta.md', 'title must be a scalar or block list'], 
	['missing field', valid.replace('summary: A dependable supper.\n', ''), 'quick-pasta.md', 'missing required front-matter field: summary'],
	['empty title', valid.replace('title: Quick pasta', 'title:'), 'quick-pasta.md', 'title must be a non-empty string'],
	['duration', valid.replace('prep_time: 10 min', 'prep_time: soon'), 'quick-pasta.md', 'prep_time must be a duration'],
	['servings', valid.replace('servings: 4', 'servings: plenty'), 'quick-pasta.md', 'servings must be a number or range'],
	['tags', valid.replace('  - weeknight', '  - speedy'), 'quick-pasta.md', 'controlled tag'],
	['duplicate tags', valid.replace('  - weeknight', '  - main'), 'quick-pasta.md', 'tags must be distinct'],
	['course tags', valid.replace('  - weeknight', '  - side'), 'quick-pasta.md', 'exactly one course tag'],
	['image path', valid.replace('---\n\n## Ingredients', 'image: https://example.com/pasta.jpg\n---\n\n## Ingredients'), 'quick-pasta.md', 'repository-local image path'],
	['ingredients', valid.replace('## Ingredients', '## Shopping'), 'quick-pasta.md', 'exactly one ## Ingredients section'],
	['method', valid.replace('1. Boil the pasta.', '- Boil the pasta.'), 'quick-pasta.md', 'numbered Method steps'],
	['body H1', valid.replace('## Ingredients', '# Quick pasta\n\n## Ingredients'), 'quick-pasta.md', 'body must not contain an H1'], 
]) {
	test(`rejects ${name}`, async () => {
		const errors = await validateCollection(await collection(recipe, filename));
		assert.ok(errors.some((error) => error.includes(filename) && error.includes(rule)), errors.join('\n'));
	});
}
