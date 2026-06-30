(function initMatchResultUtils(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.matchResultUtils = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMatchResultUtils() {
  function parseNullableInteger(value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const number = Number(value);
    if (!Number.isFinite(number) || !Number.isInteger(number) || number < 0) {
      return null;
    }

    return number;
  }

  function inferWinnerFromScores(homeScore, awayScore) {
    if (homeScore > awayScore) {
      return 'home';
    }

    if (awayScore > homeScore) {
      return 'away';
    }

    return 'draw';
  }

  function getDisplayMatchStatus(match, now = new Date()) {
    const status = match && match.status ? match.status : 'scheduled';
    if (status !== 'scheduled') {
      return status;
    }

    const kickoff = new Date(match.date);
    if (Number.isNaN(kickoff.getTime())) {
      return status;
    }

    const twoHoursMs = 2 * 60 * 60 * 1000;
    return now.getTime() - kickoff.getTime() > twoHoursMs ? 'pending' : status;
  }

  function getDefaultMatchResult() {
    return {
      status: 'scheduled',
      score: { home: null, away: null },
      winner: null,
    };
  }

  function normalizeResultEntry(entry) {
    const defaults = getDefaultMatchResult();
    const score = entry && entry.score ? entry.score : defaults.score;
    return {
      id: entry && entry.id,
      status: (entry && entry.status) || defaults.status,
      score: {
        home: score && score.home !== undefined ? score.home : null,
        away: score && score.away !== undefined ? score.away : null,
      },
      winner: entry && entry.winner !== undefined ? entry.winner : null,
    };
  }

  function mergeMatchesWithResults(matches, resultsMatches) {
    const resultsById = new Map((resultsMatches || []).map(result => [result.id, normalizeResultEntry(result)]));
    return (matches || []).map(match => {
      const result = resultsById.get(match.id) || getDefaultMatchResult();
      return {
        ...match,
        status: result.status,
        score: {
          home: result.score.home,
          away: result.score.away,
        },
        winner: result.winner,
      };
    });
  }

  function extractResultsData(matches) {
    return {
      matches: (matches || []).map(match => ({
        id: match.id,
        status: match.status || 'scheduled',
        score: {
          home: match && match.score && match.score.home !== undefined ? match.score.home : null,
          away: match && match.score && match.score.away !== undefined ? match.score.away : null,
        },
        winner: match && match.winner !== undefined ? match.winner : null,
      })),
    };
  }

  function buildUpdatedMatch(match, values) {
    const status = values.status;
    const homeScore = parseNullableInteger(values.homeScore);
    const awayScore = parseNullableInteger(values.awayScore);
    let winner = values.winner || null;

    if (status === 'scheduled') {
      return {
        ...match,
        status,
        score: { home: null, away: null },
        winner: null,
      };
    }

    if (status === 'in_progress') {
      if (winner) {
        throw new Error('In-progress matches should not have a winner yet.');
      }

      return {
        ...match,
        status,
        score: {
          home: homeScore,
          away: awayScore,
        },
        winner: null,
      };
    }

    if (homeScore === null || awayScore === null) {
      throw new Error('Completed matches need both home and away scores.');
    }

    const inferredWinner = inferWinnerFromScores(homeScore, awayScore);

    if (match.stage !== 'group' && homeScore === awayScore) {
      throw new Error('Knockout matches cannot end in a draw.');
    }

    if (winner && winner !== inferredWinner) {
      throw new Error('The selected winner does not match the scores.');
    }

    if (match.stage === 'group' && inferredWinner === 'draw') {
      winner = 'draw';
    } else if (!winner) {
      winner = inferredWinner;
    }

    return {
      ...match,
      status,
      score: { home: homeScore, away: awayScore },
      winner,
    };
  }

  return {
    parseNullableInteger,
    inferWinnerFromScores,
    getDisplayMatchStatus,
    getDefaultMatchResult,
    normalizeResultEntry,
    mergeMatchesWithResults,
    extractResultsData,
    buildUpdatedMatch,
  };
});
