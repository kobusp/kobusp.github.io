const data = require('./tournament.json');
const resultsData = require('./results.json');

const resultsByMatchId = new Map((resultsData.matches || []).map(result => [result.id, result]));

const getMatchWithResult = (match) => {
  const result = resultsByMatchId.get(match.id) || { status: 'scheduled', score: { home: null, away: null }, winner: null };
  return {
    ...match,
    status: result.status || 'scheduled',
    score: {
      home: result?.score?.home ?? null,
      away: result?.score?.away ?? null
    },
    winner: result.winner ?? null
  };
};
const getTeamPlayerIds = (team) => data.players.filter(p => p.teams.includes(team)).map(p => p.id);
const scores = {};
for (const p of data.players) {
  scores[p.id] = { name: p.name, groupStagePoints: 0, teamsRemaining: p.teams.length, totalMatches: 0, wins: 0, draws: 0, losses: 0 };
}
for (const match of data.matches) {
  const m = getMatchWithResult(match);
  if (m.stage !== 'group' || m.status !== 'completed') continue;
  const homeIds = getTeamPlayerIds(m.home.team);
  const awayIds = getTeamPlayerIds(m.away.team);
  if (m.winner === 'home') {
    homeIds.forEach(id => { scores[id].groupStagePoints += 3; scores[id].wins += 1 });
    awayIds.forEach(id => { scores[id].losses += 1 });
  } else if (m.winner === 'away') {
    awayIds.forEach(id => { scores[id].groupStagePoints += 3; scores[id].wins += 1 });
    homeIds.forEach(id => { scores[id].losses += 1 });
  } else if (m.winner === 'draw') {
    [...homeIds, ...awayIds].forEach(id => { scores[id].groupStagePoints += 1; scores[id].draws += 1 });
  }
  [...homeIds, ...awayIds].forEach(id => scores[id].totalMatches += 1);
}
console.log(scores);
