const test = require('node:test');
const assert = require('node:assert/strict');

const { WorldCupApp } = require('../js/app.js');

// WorldCupApp's constructor kicks off an async fetch()-based init() that
// depends on the DOM. For unit testing pure business logic we bypass the
// constructor entirely and build instances with only the fields the
// methods under test actually need.
function createApp(data, overrides = {}) {
  const app = Object.create(WorldCupApp.prototype);
  app.data = data;
  app.resultsByMatchId = overrides.resultsByMatchId || new Map();
  app.currentPage = 'landing';
  app.nextMatchCountdownInterval = null;
  app.leaderboardTimelineIndex = null;
  app.leaderboardTimelineExpanded = false;

  if (overrides.now) {
    app.getCurrentDateAndTime = () => overrides.now;
  }

  return app;
}

function team(name, group) {
  return { name, group };
}

function player(id, name, teams) {
  return { id, name, teams };
}

function match(id, stage, group, home, away, extra = {}) {
  return {
    id,
    stage,
    group,
    date: extra.date || '2026-06-11T19:00:00Z',
    home: { team: home },
    away: { team: away },
    status: extra.status || 'scheduled',
    score: extra.score || { home: null, away: null },
    winner: extra.winner ?? null,
  };
}

function buildStageDates() {
  return {
    group: { start: '2026-06-10T00:00:00Z', end: '2026-06-27T23:59:59Z' },
    round_of_32: { start: '2026-06-28T00:00:00Z', end: '2026-07-03T23:59:59Z' },
    round_of_16: { start: '2026-07-04T00:00:00Z', end: '2026-07-07T23:59:59Z' },
    quarter_final: { start: '2026-07-08T00:00:00Z', end: '2026-07-11T23:59:59Z' },
    semi_final: { start: '2026-07-12T00:00:00Z', end: '2026-07-15T23:59:59Z' },
    third_place: { start: '2026-07-18T00:00:00Z', end: '2026-07-18T23:59:59Z' },
    final: { start: '2026-07-19T00:00:00Z', end: '2026-07-19T23:59:59Z' },
  };
}

test('formatMatchStatus humanizes status strings', () => {
  const app = createApp({ matches: [] });
  assert.equal(app.formatMatchStatus(''), '');
  assert.equal(app.formatMatchStatus(null), '');
  assert.equal(app.formatMatchStatus('in_progress'), 'In Progress');
  assert.equal(app.formatMatchStatus('completed'), 'Completed');
  assert.equal(app.formatMatchStatus('scheduled'), 'Scheduled');
});

test('getDisplayMatchStatus flips stale scheduled matches to pending', () => {
  const app = createApp({ matches: [] });
  const now = new Date('2026-06-30T20:00:00Z');

  assert.equal(
    app.getDisplayMatchStatus({ status: 'scheduled', date: '2026-06-30T17:59:59Z' }, now),
    'pending'
  );
  assert.equal(
    app.getDisplayMatchStatus({ status: 'scheduled', date: '2026-06-30T18:30:00Z' }, now),
    'scheduled'
  );
  assert.equal(
    app.getDisplayMatchStatus({ status: 'completed', date: '2026-01-01T00:00:00Z' }, now),
    'completed'
  );
  assert.equal(
    app.getDisplayMatchStatus({ status: 'scheduled', date: 'not-a-date' }, now),
    'scheduled'
  );
});

test('hasVisibleScore detects when both scores are present', () => {
  const app = createApp({ matches: [] });
  assert.equal(app.hasVisibleScore({ score: { home: 1, away: 0 } }), true);
  assert.equal(app.hasVisibleScore({ score: { home: null, away: 0 } }), false);
  assert.equal(app.hasVisibleScore({ score: { home: 0, away: undefined } }), false);
  assert.equal(app.hasVisibleScore({}), false);
});

test('mergeMatchesWithResults overlays results and falls back to defaults', () => {
  const app = createApp({ matches: [] });
  app.resultsByMatchId = new Map([
    ['M1', { status: 'completed', score: { home: 2, away: 1 }, winner: 'home' }],
  ]);

  const merged = app.mergeMatchesWithResults([
    { id: 'M1', stage: 'group' },
    { id: 'M2', stage: 'group' },
  ]);

  assert.deepEqual(merged, [
    { id: 'M1', stage: 'group', status: 'completed', score: { home: 2, away: 1 }, winner: 'home' },
    { id: 'M2', stage: 'group', status: 'scheduled', score: { home: null, away: null }, winner: null },
  ]);
});

test('getStageOrder ranks stages in tournament progression order', () => {
  const app = createApp({ matches: [] });
  assert.equal(app.getStageOrder('group'), 0);
  assert.equal(app.getStageOrder('final'), 6);
  assert.ok(app.getStageOrder('quarter_final') > app.getStageOrder('round_of_16'));
  assert.equal(app.getStageOrder('not_a_stage'), 7);
});

test('getCurrentStage resolves to the stage covering "now"', () => {
  const data = { tournament: { stageDates: buildStageDates() }, matches: [] };

  assert.equal(createApp(data, { now: new Date('2026-06-15T00:00:00Z') }).getCurrentStage(), 'group');
  assert.equal(createApp(data, { now: new Date('2026-06-29T00:00:00Z') }).getCurrentStage(), 'round_of_32');
  assert.equal(createApp(data, { now: new Date('2026-07-19T12:00:00Z') }).getCurrentStage(), 'final');
});

test('calculateTeamGroupPoints only counts completed group-stage matches', () => {
  const data = {
    teams: [team('Home', 'A'), team('Away', 'A'), team('Bench', 'A')],
    matches: [
      match('M1', 'group', 'A', 'Home', 'Away', { status: 'completed', winner: 'home' }),
      match('M2', 'group', 'A', 'Home', 'Bench', { status: 'completed', winner: 'draw' }),
      match('M3', 'round_of_32', 'A', 'Home', 'Away', { status: 'completed', winner: 'away' }),
    ],
  };
  const points = createApp(data).calculateTeamGroupPoints();

  assert.equal(points.Home, 4); // 3 for the win + 1 for the draw
  assert.equal(points.Away, 0); // the knockout win must not count
  assert.equal(points.Bench, 1);
});

test('rankTeamsInGroup breaks a points tie using head-to-head result', () => {
  const groupTeams = ['Alpha', 'Bravo', 'Charlie'];
  const matches = [
    // Alpha and Bravo both finish on 3 points, but Alpha beat Bravo head-to-head.
    match('M1', 'group', 'A', 'Alpha', 'Bravo', { status: 'completed', winner: 'home', score: { home: 2, away: 1 } }),
    match('M2', 'group', 'A', 'Bravo', 'Charlie', { status: 'completed', winner: 'home', score: { home: 3, away: 0 } }),
  ];
  const app = createApp({ teams: groupTeams.map(name => team(name, 'A')), matches: [] });

  const { sortedTeams } = app.rankTeamsInGroup(groupTeams, matches);

  // Alpha: 3 (Bravo win); Bravo: 3 (Charlie win) -> tied on points, Alpha wins h2h.
  assert.equal(sortedTeams[0], 'Alpha');
  assert.equal(sortedTeams[1], 'Bravo');
  assert.equal(sortedTeams[2], 'Charlie');
});

test('getCurrentActiveTeams removes knockout losers but keeps everyone in group stage', () => {
  const data = {
    teams: [team('A', 'G'), team('B', 'G'), team('C', 'G'), team('D', 'G')],
    tournament: { stageDates: buildStageDates() },
    matches: [
      match('R32-1', 'round_of_32', null, 'A', 'B', { status: 'completed', winner: 'home' }),
      match('R32-2', 'round_of_32', null, 'C', 'D', { status: 'completed', winner: 'away' }),
    ],
  };

  const duringGroup = createApp(data, { now: new Date('2026-06-15T00:00:00Z') }).getCurrentActiveTeams();
  assert.deepEqual([...duringGroup].sort(), ['A', 'B', 'C', 'D']);

  const duringR16 = createApp(data, { now: new Date('2026-07-05T00:00:00Z') }).getCurrentActiveTeams();
  assert.deepEqual([...duringR16].sort(), ['A', 'D']);
});

test('getNextMatch prioritizes an in-progress match over scheduled ones', () => {
  const data = {
    matches: [
      match('M1', 'group', 'A', 'Home1', 'Away1', { status: 'completed', date: '2026-06-10T00:00:00Z' }),
      match('M2', 'group', 'A', 'Home2', 'Away2', { status: 'scheduled', date: '2026-06-20T00:00:00Z' }),
      match('M3', 'group', 'A', 'Home3', 'Away3', { status: 'in_progress', date: '2026-06-15T00:00:00Z' }),
    ],
  };
  const app = createApp(data, { now: new Date('2026-06-16T00:00:00Z') });
  assert.equal(app.getNextMatch().id, 'M3');
});

test('getNextMatch falls back to the next upcoming non-completed match', () => {
  const data = {
    matches: [
      match('M1', 'group', 'A', 'Home1', 'Away1', { status: 'completed', date: '2026-06-10T00:00:00Z' }),
      match('M2', 'group', 'A', 'Home2', 'Away2', { status: 'scheduled', date: '2026-06-20T00:00:00Z' }),
    ],
  };
  const app = createApp(data, { now: new Date('2026-06-16T00:00:00Z') });
  assert.equal(app.getNextMatch().id, 'M2');
});

test('calculatePlayerScoresFromMatches and getRankedPlayersFromScores rank winners first', () => {
  const data = {
    players: [
      player('P1', 'Aiden', ['Home']),
      player('P2', 'Cameron', ['Away']),
    ],
    matches: [],
  };
  const app = createApp(data);
  const completedMatches = [
    match('M1', 'group', 'A', 'Home', 'Away', { status: 'completed', winner: 'home' }),
  ];
  const activeTeams = new Set(['Home', 'Away']);

  const scores = app.calculatePlayerScoresFromMatches(completedMatches, activeTeams);
  assert.equal(scores.P1.groupStagePoints, 3);
  assert.equal(scores.P1.wins, 1);
  assert.equal(scores.P2.losses, 1);

  const ranked = app.getRankedPlayersFromScores(scores, 'group');
  assert.equal(ranked[0].name, 'Aiden');
  assert.equal(ranked[1].name, 'Cameron');
});

test('getCompletedMatches returns only completed matches sorted by date', () => {
  const data = {
    matches: [
      match('M2', 'group', 'A', 'H2', 'A2', { status: 'completed', date: '2026-06-20T00:00:00Z' }),
      match('M1', 'group', 'A', 'H1', 'A1', { status: 'completed', date: '2026-06-10T00:00:00Z' }),
      match('M3', 'group', 'A', 'H3', 'A3', { status: 'scheduled', date: '2026-06-05T00:00:00Z' }),
    ],
  };
  const app = createApp(data);
  const completed = app.getCompletedMatches();
  assert.deepEqual(completed.map(m => m.id), ['M1', 'M2']);
});

test('generatePermutations produces every ordering exactly once', () => {
  const app = createApp({ matches: [] });
  const perms = app.generatePermutations(['A', 'B', 'C']);

  assert.equal(perms.length, 6);
  const asStrings = new Set(perms.map(p => p.join('')));
  assert.equal(asStrings.size, 6);
  assert.ok(asStrings.has('ABC'));
  assert.ok(asStrings.has('CBA'));
});

test('getNavRouteFromHash maps hashes to top-level nav routes', () => {
  const app = createApp({ matches: [] });
  const originalWindow = global.window;
  global.window = { location: { hash: '' } };

  try {
    global.window.location.hash = '#matches?team=Brazil';
    assert.equal(app.getNavRouteFromHash(), 'matches');

    global.window.location.hash = '#match/M1';
    assert.equal(app.getNavRouteFromHash(), 'matches');

    global.window.location.hash = '#player/Aiden';
    assert.equal(app.getNavRouteFromHash(), 'leaderboard');

    global.window.location.hash = '#landing';
    assert.equal(app.getNavRouteFromHash(), 'home');

    global.window.location.hash = '#unknown-route';
    assert.equal(app.getNavRouteFromHash(), 'home');
  } finally {
    global.window = originalWindow;
  }
});
