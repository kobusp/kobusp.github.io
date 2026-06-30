const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseNullableInteger,
  inferWinnerFromScores,
  getDisplayMatchStatus,
  mergeMatchesWithResults,
  extractResultsData,
  buildUpdatedMatch,
} = require('../js/match-result-utils.js');

test('parseNullableInteger returns integers and rejects invalid input', () => {
  assert.equal(parseNullableInteger('3'), 3);
  assert.equal(parseNullableInteger(0), 0);
  assert.equal(parseNullableInteger(''), null);
  assert.equal(parseNullableInteger('2.2'), null);
  assert.equal(parseNullableInteger('-1'), null);
  assert.equal(parseNullableInteger('abc'), null);
});

test('inferWinnerFromScores handles all outcomes', () => {
  assert.equal(inferWinnerFromScores(2, 1), 'home');
  assert.equal(inferWinnerFromScores(1, 2), 'away');
  assert.equal(inferWinnerFromScores(1, 1), 'draw');
});

test('getDisplayMatchStatus converts stale scheduled matches to pending', () => {
  const now = new Date('2026-06-30T20:00:00Z');
  assert.equal(
    getDisplayMatchStatus({ status: 'scheduled', date: '2026-06-30T17:59:59Z' }, now),
    'pending'
  );
  assert.equal(
    getDisplayMatchStatus({ status: 'scheduled', date: '2026-06-30T18:30:00Z' }, now),
    'scheduled'
  );
  assert.equal(
    getDisplayMatchStatus({ status: 'completed', date: '2026-06-30T00:00:00Z' }, now),
    'completed'
  );
});

test('mergeMatchesWithResults overlays result data and defaults safely', () => {
  const matches = [
    { id: 'm1', stage: 'group' },
    { id: 'm2', stage: 'group' },
  ];
  const results = [
    { id: 'm1', status: 'completed', score: { home: 1, away: 0 }, winner: 'home' },
  ];

  assert.deepEqual(mergeMatchesWithResults(matches, results), [
    { id: 'm1', stage: 'group', status: 'completed', score: { home: 1, away: 0 }, winner: 'home' },
    { id: 'm2', stage: 'group', status: 'scheduled', score: { home: null, away: null }, winner: null },
  ]);
});

test('extractResultsData keeps only persisted result fields', () => {
  const data = extractResultsData([
    {
      id: 'm1',
      stage: 'group',
      status: 'completed',
      score: { home: 2, away: 2 },
      winner: 'draw',
      home: { team: 'A' },
      away: { team: 'B' },
    },
  ]);

  assert.deepEqual(data, {
    matches: [{ id: 'm1', status: 'completed', score: { home: 2, away: 2 }, winner: 'draw' }],
  });
});

test('buildUpdatedMatch clears data for scheduled status', () => {
  const match = { id: 'm1', stage: 'group', score: { home: 4, away: 1 }, winner: 'home' };
  assert.deepEqual(
    buildUpdatedMatch(match, { status: 'scheduled', homeScore: '4', awayScore: '1', winner: 'home' }),
    { id: 'm1', stage: 'group', status: 'scheduled', score: { home: null, away: null }, winner: null }
  );
});

test('buildUpdatedMatch rejects invalid in-progress winner', () => {
  assert.throws(
    () => buildUpdatedMatch({ id: 'm1', stage: 'group' }, { status: 'in_progress', homeScore: '', awayScore: '', winner: 'home' }),
    /In-progress matches should not have a winner yet/
  );
});

test('buildUpdatedMatch enforces completed score rules', () => {
  assert.throws(
    () => buildUpdatedMatch({ id: 'm1', stage: 'group' }, { status: 'completed', homeScore: '', awayScore: '1', winner: '' }),
    /Completed matches need both home and away scores/
  );
  assert.throws(
    () => buildUpdatedMatch({ id: 'm2', stage: 'quarter_final' }, { status: 'completed', homeScore: '1', awayScore: '1', winner: '' }),
    /Knockout matches cannot end in a draw/
  );
  assert.throws(
    () => buildUpdatedMatch({ id: 'm3', stage: 'group' }, { status: 'completed', homeScore: '2', awayScore: '1', winner: 'away' }),
    /The selected winner does not match the scores/
  );
});

test('buildUpdatedMatch infers winners correctly', () => {
  const knockout = buildUpdatedMatch(
    { id: 'm1', stage: 'quarter_final' },
    { status: 'completed', homeScore: '3', awayScore: '1', winner: '' }
  );
  assert.equal(knockout.winner, 'home');

  const groupDraw = buildUpdatedMatch(
    { id: 'm2', stage: 'group' },
    { status: 'completed', homeScore: '1', awayScore: '1', winner: '' }
  );
  assert.equal(groupDraw.winner, 'draw');
});
