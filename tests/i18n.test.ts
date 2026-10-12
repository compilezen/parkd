import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messages } from '../src/i18n/catalog.ts';
import { languages, setCurrentLanguage, t, isRTL } from '../src/i18n/engine.ts';
import { newSpot, returnSteps, describeSpot } from '../src/parking.ts';
import { parkingUpdate } from '../src/live-update-model.ts';

test('every bundled message has all five translations and matching interpolation fields', () => {
  const keys = new Set<string>();
  for (const row of messages) {
    assert.equal(row.length, 5, row[0]); assert.ok(!keys.has(row[0]), `duplicate ${row[0]}`); keys.add(row[0]);
    const fields = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    for (const value of row) { assert.ok(value.trim(), row[0]); assert.deepEqual(fields(value), fields(row[0]), row[0]); assert.ok(!value.includes('\\n'), row[0]); }
  }
});
test('return steps and notification copy localize while entered clues remain untouched', () => {
  const spot = { ...newSpot(), floor: 'B1', zone: 'X', space: '142', entrance: 'Bershka', note: 'Floor / Zone: keep exactly', returning: true };
  for (const language of languages) {
    setCurrentLanguage(language.id);
    assert.equal(isRTL(), language.id === 'ar');
    assert.ok(returnSteps(spot)[0].title.includes('Bershka'));
    assert.equal(returnSteps(spot).at(-1)?.detail, spot.note);
    assert.ok(describeSpot(spot).includes('B1'));
    assert.ok(parkingUpdate(spot).body.includes('Bershka'));
    if (language.id !== 'en') {
      assert.notEqual(returnSteps(spot)[0].title, 'Go to Bershka');
      assert.ok(!parkingUpdate(spot).title.includes('Your way back'));
    }
    assert.equal(t('Saved {date} at {time}', { date: '12/10', time: '22:30' }).includes('{date}'), false);
  }
  setCurrentLanguage('en');
});

// Guard the user-facing source so new static labels cannot bypass localization.
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { hasMessage } from '../src/i18n/engine.ts';
test('static JSX labels and app error messages use the offline catalog', () => {
  const paths = ['src/ui.tsx', 'src/android-parking-tools.tsx', ...readdirSync('src/app').filter(name => name.endsWith('.tsx')).map(name => `src/app/${name}`)];
  for (const path of paths) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isJsxText(node) && /[a-z]/i.test(node.text)) assert.fail(`Untranslated JSX text in ${path}: ${node.text}`);
      if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'accessibilityLabel'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) {
        assert.equal(node.initializer.text, 'parkd', `Untranslated attribute in ${path}: ${node.initializer.text}`);
      }
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'setError' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text) {
        assert.ok(hasMessage(node.arguments[0].text), `Uncatalogued error in ${path}: ${node.arguments[0].text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
