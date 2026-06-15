// Country flag emoji mapping
const countryFlags = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Czechia': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Haiti': '🇭🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Australia': '🇦🇺',
  'Turkey': '🇹🇷',
  'Germany': '🇩🇪',
  'Curaçao': '🇨🇼',
  'Ivory Coast': '🇨🇮',
  'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱',
  'Japan': '🇯🇵',
  'Sweden': '🇸🇪',
  'Tunisia': '🇹🇳',
  'Belgium': '🇧🇪',
  'Egypt': '🇪🇬',
  'Iran': '🇮🇷',
  'New Zealand': '🇳🇿',
  'Spain': '🇪🇸',
  'Cape Verde': '🇨🇻',
  'Saudi Arabia': '🇸🇦',
  'Uruguay': '🇺🇾',
  'France': '🇫🇷',
  'Senegal': '🇸🇳',
  'Iraq': '🇮🇶',
  'Norway': '🇳🇴',
  'Argentina': '🇦🇷',
  'Algeria': '🇩🇿',
  'Austria': '🇦🇹',
  'Jordan': '🇯🇴',
  'Portugal': '🇵🇹',
  'DR Congo': '🇨🇩',
  'Uzbekistan': '🇺🇿',
  'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croatia': '🇭🇷',
  'Ghana': '🇬🇭',
  'Panama': '🇵🇦'
};

// Player initials for avatars
const playerInitials = {
  'Aiden': 'A',
  'Cameron': 'C',
  'Gary': 'G',
  'Gizelle': 'G',
  'Jo': 'Jo',
  'Kobus': 'K',
  'Lindsay': 'L',
  'Seth': 'S'
};

class WorldCupApp {
   constructor() {
     this.data = null;
     this.resultsByMatchId = new Map();
     this.currentPage = 'landing';
     this.nextMatchCountdownInterval = null;
     this.leaderboardTimelineIndex = null; // null = current; 0+ = after match N
     this.leaderboardTimelineExpanded = false;
     this.init();
   }

  async init() {
    try {
      const cacheBust = window.__CACHE_BUST__ ? `?v=${encodeURIComponent(window.__CACHE_BUST__)}` : '';
      const [tournamentResponse, resultsResponse] = await Promise.all([
        fetch(`tournament.json${cacheBust}`, { cache: 'no-store' }),
        fetch(`results.json${cacheBust}`, { cache: 'no-store' })
      ]);

      if (!tournamentResponse.ok) {
        throw new Error(`Failed to load tournament.json (HTTP ${tournamentResponse.status})`);
      }
      if (!resultsResponse.ok) {
        throw new Error(`Failed to load results.json (HTTP ${resultsResponse.status})`);
      }

      const tournamentData = await tournamentResponse.json();
      const resultsData = await resultsResponse.json();

      this.resultsByMatchId = new Map((resultsData.matches || []).map(result => [result.id, result]));
      tournamentData.matches = this.mergeMatchesWithResults(tournamentData.matches || []);
      this.data = tournamentData;
      this.setupEventListeners();
      if (window.location.hash) {
        this.routeFromHash();
      } else {
        this.setHash('home');
      }
    } catch (error) {
      console.error('Error loading tournament data:', error);
      document.getElementById('landingPage').innerHTML = '<p>Error loading tournament data</p>';
    }
  }

  getCurrentDateAndTime() {
    // return new Date('2026-07-06T00:00:00Z');
    return new Date();
  }

  setupEventListeners() {
    document.getElementById('navToggle').addEventListener('click', () => {
      document.getElementById('navMenu').classList.toggle('active');
    });

    window.addEventListener('hashchange', () => {
      this.routeFromHash();
    });
  }

  setHash(route) {
    const nextHash = route.startsWith('#') ? route : `#${route}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }

  formatMatchStatus(status) {
    if (!status) return '';
    if (status === 'in_progress') return 'In Progress';
    return status
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  getDisplayMatchStatus(match, now = this.getCurrentDateAndTime()) {
    const status = match?.status || 'scheduled';
    if (status !== 'scheduled') return status;

    const kickoff = new Date(match.date);
    if (Number.isNaN(kickoff.getTime())) return status;

    const twoHoursMs = 2 * 60 * 60 * 1000;
    return now.getTime() - kickoff.getTime() > twoHoursMs ? 'pending' : status;
  }

  hasVisibleScore(match) {
    return match?.score?.home !== null && match?.score?.home !== undefined
      && match?.score?.away !== null && match?.score?.away !== undefined;
  }

  getDefaultMatchResult() {
    return {
      status: 'scheduled',
      score: { home: null, away: null },
      winner: null
    };
  }

  mergeMatchesWithResults(matches) {
    return matches.map(match => {
      const result = this.resultsByMatchId.get(match.id) || this.getDefaultMatchResult();
      const score = result.score || { home: null, away: null };
      return {
        ...match,
        status: result.status || 'scheduled',
        score: {
          home: score.home ?? null,
          away: score.away ?? null
        },
        winner: result.winner ?? null
      };
    });
  }

  getNavRouteFromHash() {
    const hash = window.location.hash.replace(/^#/, '');
    const [routePart] = hash.split('?');
    const route = (routePart || 'home').toLowerCase();

    if (route.startsWith('match/')) return 'matches';
    if (route.startsWith('player/')) return 'leaderboard';
    if (route === 'landing') return 'home';
    if (['home', 'leaderboard', 'matches', 'teams', 'prizes'].includes(route)) return route;
    return 'home';
  }

  updateActiveNav() {
    const activeRoute = this.getNavRouteFromHash();
    document.querySelectorAll('#navMenu a').forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkRoute = href.startsWith('#') ? href.slice(1).toLowerCase() : '';
      link.classList.toggle('active', linkRoute === activeRoute);
    });
  }

  routeFromHash() {
    this.updateActiveNav();

    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      this.showLanding(false);
      return;
    }

    const [routePart, queryPart = ''] = hash.split('?');
    const route = routePart.toLowerCase();
    const params = new URLSearchParams(queryPart);

    if (route === 'home' || route === 'landing') {
      this.showLanding(false);
      return;
    }

    if (route === 'leaderboard') {
      this.showLeaderboard(false);
      return;
    }

    if (route === 'matches') {
      const team = params.get('team');
      this.showMatches(team ? decodeURIComponent(team) : null, false);
      return;
    }

    if (route === 'teams') {
      this.showTeams(false);
      return;
    }

    if (route === 'prizes') {
      this.showPrizes(false);
      return;
    }

    if (route.startsWith('player/')) {
      const playerName = decodeURIComponent(routePart.slice('player/'.length));
      this.showPlayerDetail(playerName, false);
      return;
    }

    if (route.startsWith('match/')) {
      const matchId = decodeURIComponent(routePart.slice('match/'.length));
      this.showMatchDetail(matchId, false);
      return;
    }

    this.showLanding(false);
  }

  getCurrentStage() {
    const now = this.getCurrentDateAndTime();
    const stages = this.data.tournament.stageDates;

    if (now < new Date(stages.group.end)) return 'group';
    if (now < new Date(stages.round_of_32.end)) return 'round_of_32';
    if (now < new Date(stages.round_of_16.end)) return 'round_of_16';
    if (now < new Date(stages.quarter_final.end)) return 'quarter_final';
    if (now < new Date(stages.semi_final.end)) return 'semi_final';
    if (now < new Date(stages.third_place.end)) return 'third_place';
    return 'final';
  }

  getNextMatch() {
    const now = this.getCurrentDateAndTime();

    for (let match of this.data.matches) {
      if (match.status === 'in_progress') {
        return match;
      }
    }

    // Prefer an ongoing non-completed match (kickoff + 2 hours window)
    for (let match of this.data.matches) {
      if (match.status === 'completed') continue;
      const kickoff = new Date(match.date);
      const matchEnd = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));
      if (now >= kickoff && now < matchEnd) {
        return match;
      }
    }

    // Otherwise pick the next upcoming non-completed match
    for (let match of this.data.matches) {
      if (new Date(match.date) >= now && match.status !== 'completed') {
        return match;
      }
    }
    return this.data.matches[this.data.matches.length - 1];
  }

  stopNextMatchCountdown() {
    if (this.nextMatchCountdownInterval) {
      clearInterval(this.nextMatchCountdownInterval);
      this.nextMatchCountdownInterval = null;
    }
  }

  startNextMatchCountdown(nextMatch) {
    const countdownElement = document.getElementById('nextMatchCountdown');
    if (!countdownElement || !nextMatch) return;

    this.stopNextMatchCountdown();
    const kickoff = new Date(nextMatch.date);
    const matchEnd = new Date(kickoff.getTime() + (2 * 60 * 60 * 1000));

    const updateCountdown = () => {
      const now = this.getCurrentDateAndTime();
      const diffMs = kickoff.getTime() - now.getTime();

      if (nextMatch.status === 'in_progress') {
        countdownElement.textContent = 'LIVE NOW';
        countdownElement.classList.add('live-now');
        return;
      }

      if (nextMatch.status !== 'completed' && now >= kickoff && now < matchEnd) {
        countdownElement.textContent = 'LIVE NOW';
        countdownElement.classList.add('live-now');
        return;
      }

      countdownElement.classList.remove('live-now');

      if (nextMatch.status === 'completed') {
        countdownElement.textContent = 'Match completed';
        return;
      }

      if (diffMs <= 0) {
        countdownElement.textContent = 'Kickoff now';
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      countdownElement.textContent = `Kickoff in ${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    };

    updateCountdown();
    this.nextMatchCountdownInterval = setInterval(updateCountdown, 1000);
  }

  getTeamPlayerIds(teamName) {
    const ids = [];
    for (let player of this.data.players) {
      if (player.teams.includes(teamName)) {
        ids.push(player.id);
      }
    }
    return ids;
  }

  getTeamPlayerNames(teamName) {
    const names = [];
    for (let player of this.data.players) {
      if (player.teams.includes(teamName)) {
        names.push(player.name);
      }
    }
    return names;
  }

  getPlayersForMatch(match) {
     const homePlayers = this.getTeamPlayerNames(match.home.team);
     const awayPlayers = this.getTeamPlayerNames(match.away.team);
     const homePlayerIds = this.getTeamPlayerIds(match.home.team);
     const awayPlayerIds = this.getTeamPlayerIds(match.away.team);
     const homePlayerObjects = this.getTeamPlayerObjects(match.home.team);
     const awayPlayerObjects = this.getTeamPlayerObjects(match.away.team);
     return { homePlayers, awayPlayers, homePlayerIds, awayPlayerIds, homePlayerObjects, awayPlayerObjects };
   }

   getTeamPlayerObjects(teamName) {
     const players = [];
     for (let player of this.data.players) {
       if (player.teams.includes(teamName)) {
         players.push(player);
       }
     }
     return players;
   }

  calculateTeamGroupPoints() {
    const points = {};
    for (let team of this.data.teams) {
      points[team.name] = 0;
    }
    for (let match of this.data.matches) {
      if (match.stage !== 'group' || match.status !== 'completed') continue;
      if (match.winner === 'home') {
        points[match.home.team] = (points[match.home.team] || 0) + 3;
      } else if (match.winner === 'away') {
        points[match.away.team] = (points[match.away.team] || 0) + 3;
      } else if (match.winner === 'draw') {
        points[match.home.team] = (points[match.home.team] || 0) + 1;
        points[match.away.team] = (points[match.away.team] || 0) + 1;
      }
    }
    return points;
  }

  calculatePlayerScoresFromMatches(completedGroupMatches) {
    const scores = {};
    for (let player of this.data.players) {
      scores[player.id] = {
        name: player.name,
        groupStagePoints: 0,
        teamsRemaining: player.teams.length,
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0
      };
    }
    for (let match of completedGroupMatches) {
      const homePlayerIds = this.getTeamPlayerIds(match.home.team);
      const awayPlayerIds = this.getTeamPlayerIds(match.away.team);
      if (match.winner === 'home') {
        for (let pid of homePlayerIds) { scores[pid].groupStagePoints += 3; scores[pid].wins += 1; }
        for (let pid of awayPlayerIds) { scores[pid].losses += 1; }
      } else if (match.winner === 'away') {
        for (let pid of awayPlayerIds) { scores[pid].groupStagePoints += 3; scores[pid].wins += 1; }
        for (let pid of homePlayerIds) { scores[pid].losses += 1; }
      } else if (match.winner === 'draw') {
        for (let pid of [...homePlayerIds, ...awayPlayerIds]) { scores[pid].groupStagePoints += 1; scores[pid].draws += 1; }
      }
      for (let pid of [...homePlayerIds, ...awayPlayerIds]) { scores[pid].totalMatches += 1; }
    }
    return scores;
  }

  calculatePlayerScores() {
    const completedGroupMatches = this.data.matches.filter(
      m => m.stage === 'group' && m.status === 'completed'
    );
    return this.calculatePlayerScoresFromMatches(completedGroupMatches);
  }

  getRankedPlayersFromScores(scores, currentStage) {
    return Object.values(scores).sort((a, b) => {
      if (currentStage === 'group' || currentStage === 'final') {
        return b.groupStagePoints - a.groupStagePoints;
      }
      return b.teamsRemaining - a.teamsRemaining;
    });
  }

   getLeaderboardMovementsFromMatches(beforeMatches, afterMatches, currentStage) {
     const beforeRanked = this.getRankedPlayersFromScores(
       this.calculatePlayerScoresFromMatches(beforeMatches), currentStage
     );
     const afterRanked = this.getRankedPlayersFromScores(
       this.calculatePlayerScoresFromMatches(afterMatches), currentStage
     );

     const beforePositions = {};
     const afterPositions = {};
     beforeRanked.forEach((p, i) => { beforePositions[p.name] = i + 1; });
     afterRanked.forEach((p, i) => { afterPositions[p.name] = i + 1; });

     const movements = {};
     for (let player of this.data.players) {
       const after = afterPositions[player.name];
       const before = beforePositions[player.name];
       movements[player.name] = (after != null && before != null) ? before - after : 0;
     }
     return movements;
   }

   getLeaderboardMovements() {
     const currentStage = this.getCurrentStage();

     // All completed group matches sorted by date ascending
     const completedGroupMatches = this.data.matches
       .filter(m => m.stage === 'group' && m.status === 'completed')
       .sort((a, b) => new Date(a.date) - new Date(b.date));

     if (completedGroupMatches.length === 0) {
       return {};
     }

     // Find the latest UTC calendar date that has completed matches
     const latestDate = completedGroupMatches[completedGroupMatches.length - 1].date.slice(0, 10);

     // Matches before the latest batch
     const prevMatches = completedGroupMatches.filter(m => m.date.slice(0, 10) < latestDate);

     // If nothing came before, everyone is "new" — no movement to show
     if (prevMatches.length === 0) {
       return {};
     }

     return this.getLeaderboardMovementsFromMatches(prevMatches, completedGroupMatches, currentStage);
   }

   getRankedPlayers() {
     const scores = this.calculatePlayerScores();
     const currentStage = this.getCurrentStage();
     return this.getRankedPlayersFromScores(scores, currentStage);
   }

   getCompletedGroupMatches() {
     return this.data.matches
       .filter(m => m.stage === 'group' && m.status === 'completed')
       .sort((a, b) => new Date(a.date) - new Date(b.date));
   }

   getLeaderboardAtMatchIndex(matchIndex) {
     const completedMatches = this.getCompletedGroupMatches();
     if (matchIndex < 0 || matchIndex >= completedMatches.length) {
       return null;
     }
     const matchesUpToIndex = completedMatches.slice(0, matchIndex + 1);
     const scores = this.calculatePlayerScoresFromMatches(matchesUpToIndex);
     const currentStage = this.getCurrentStage();
     return this.getRankedPlayersFromScores(scores, currentStage);
   }

   getMovementsBetweenMatches(beforeIndex, afterIndex) {
     const completedMatches = this.getCompletedGroupMatches();
     if (beforeIndex < -1 || afterIndex >= completedMatches.length) {
       return {};
     }

     const currentStage = this.getCurrentStage();
     const beforeMatches = beforeIndex < 0 ? [] : completedMatches.slice(0, beforeIndex + 1);
     const afterMatches = completedMatches.slice(0, afterIndex + 1);

     return this.getLeaderboardMovementsFromMatches(beforeMatches, afterMatches, currentStage);
   }

   updateLeaderboardTimelineContent() {
     const completedMatches = this.getCompletedGroupMatches();
     if (completedMatches.length === 0) return;

     const clampedIndex = Math.max(0, Math.min(this.leaderboardTimelineIndex, completedMatches.length - 1));
     this.leaderboardTimelineIndex = clampedIndex;

     const currentStage = this.getCurrentStage();
     const showTeamsRemaining = currentStage !== 'group';
     const currentMatch = completedMatches[clampedIndex];

     const homeFlag = countryFlags[currentMatch.home.team] || '🏴';
     const awayFlag = countryFlags[currentMatch.away.team] || '🏴';
     const hasScore = this.hasVisibleScore(currentMatch);
     const scoreText = hasScore ? `${currentMatch.score.home} - ${currentMatch.score.away}` : 'TBD';
     const matchDateObj = new Date(currentMatch.date);
     const matchDateStr = matchDateObj.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: '2-digit' });

     const counterEl = document.getElementById('leaderboardTimelineCounter');
     const homeFlagEl = document.getElementById('leaderboardTimelineHomeFlag');
     const homeTeamEl = document.getElementById('leaderboardTimelineHomeTeam');
     const scoreEl = document.getElementById('leaderboardTimelineScore');
     const awayFlagEl = document.getElementById('leaderboardTimelineAwayFlag');
     const awayTeamEl = document.getElementById('leaderboardTimelineAwayTeam');
     const dateEl = document.getElementById('leaderboardTimelineDate');
     const sliderEl = document.getElementById('leaderboardMatchSlider');
     const firstBtnEl = document.getElementById('leaderboardTimelineFirstBtn');
     const prevBtnEl = document.getElementById('leaderboardTimelinePrevBtn');
     const nextBtnEl = document.getElementById('leaderboardTimelineNextBtn');
     const latestBtnEl = document.getElementById('leaderboardTimelineLatestBtn');

     if (counterEl) counterEl.textContent = `Match ${clampedIndex + 1} / ${completedMatches.length}`;
     if (homeFlagEl) homeFlagEl.textContent = homeFlag;
     if (homeTeamEl) homeTeamEl.textContent = currentMatch.home.team;
     if (scoreEl) scoreEl.textContent = scoreText;
     if (awayFlagEl) awayFlagEl.textContent = awayFlag;
     if (awayTeamEl) awayTeamEl.textContent = currentMatch.away.team;
     if (dateEl) dateEl.textContent = matchDateStr;

     if (sliderEl) {
       sliderEl.max = String(completedMatches.length - 1);
       sliderEl.value = String(clampedIndex);
     }

     const atStart = clampedIndex === 0;
     const atEnd = clampedIndex === completedMatches.length - 1;
     if (firstBtnEl) firstBtnEl.disabled = atStart;
     if (prevBtnEl) prevBtnEl.disabled = atStart;
     if (nextBtnEl) nextBtnEl.disabled = atEnd;
     if (latestBtnEl) latestBtnEl.disabled = atEnd;

     const rankedAtIndex = this.getLeaderboardAtMatchIndex(clampedIndex);
     let movements = {};
     if (clampedIndex > 0) {
       movements = this.getMovementsBetweenMatches(clampedIndex - 1, clampedIndex);
     }

     const tableContainer = document.getElementById('leaderboardTableContainer');
     if (tableContainer && rankedAtIndex) {
       tableContainer.innerHTML = this.renderLeaderboardTable(rankedAtIndex, movements, showTeamsRemaining);
     }
   }

  awardGroupMatchPoints(match, pointsMap) {
    if (match.stage !== 'group' || match.status !== 'completed') return;

    const homePlayerIds = this.getTeamPlayerIds(match.home.team);
    const awayPlayerIds = this.getTeamPlayerIds(match.away.team);

    if (match.winner === 'home') {
      for (let pid of homePlayerIds) pointsMap[pid] += 3;
    } else if (match.winner === 'away') {
      for (let pid of awayPlayerIds) pointsMap[pid] += 3;
    } else if (match.winner === 'draw') {
      for (let pid of [...homePlayerIds, ...awayPlayerIds]) pointsMap[pid] += 1;
    }
  }

  getGroupStagePrizeWinner() {
    const completedGroupMatches = this.data.matches
      .filter(match => match.stage === 'group' && match.status === 'completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (completedGroupMatches.length === 0) return null;

    const finalPoints = {};
    const playerOrder = {};
    for (let i = 0; i < this.data.players.length; i++) {
      const player = this.data.players[i];
      finalPoints[player.id] = 0;
      playerOrder[player.id] = i;
    }

    for (let match of completedGroupMatches) {
      this.awardGroupMatchPoints(match, finalPoints);
    }

    const maxPoints = Math.max(...Object.values(finalPoints));
    const topPlayerIds = Object.keys(finalPoints).filter(pid => finalPoints[pid] === maxPoints);

    if (topPlayerIds.length === 1) {
      const winner = this.data.players.find(player => player.id === topPlayerIds[0]);
      return {
        winnerName: winner ? winner.name : 'Unknown',
        points: maxPoints,
        tieBreakApplied: false
      };
    }

    const runningPoints = {};
    const reachedAt = {};
    for (let player of this.data.players) {
      runningPoints[player.id] = 0;
      reachedAt[player.id] = null;
    }

    for (let match of completedGroupMatches) {
      this.awardGroupMatchPoints(match, runningPoints);
      for (let pid of topPlayerIds) {
        if (reachedAt[pid] === null && runningPoints[pid] >= maxPoints) {
          reachedAt[pid] = new Date(match.date).getTime();
        }
      }
    }

    const winnerId = topPlayerIds.sort((a, b) => {
      const timeA = reachedAt[a] === null ? Infinity : reachedAt[a];
      const timeB = reachedAt[b] === null ? Infinity : reachedAt[b];
      if (timeA !== timeB) return timeA - timeB;
      return playerOrder[a] - playerOrder[b];
    })[0];

    const winner = this.data.players.find(player => player.id === winnerId);
    return {
      winnerName: winner ? winner.name : 'Unknown',
      points: maxPoints,
      tieBreakApplied: true
    };
  }

  getPrizeAssignments() {
    const prizePool = Number(this.data.tournament.prizePool || 0);
    const payoutShares = {
      first: 0.40,
      second: 0.30,
      third: 0.20,
      group: 0.10
    };

    const rankedPlayers = this.getRankedPlayers();
    const currentStage = this.getCurrentStage();
    const groupStageAssigned = currentStage !== 'group';
    const thirdPlaceMatch = this.data.matches.find(match => match.stage === 'third_place');
    const finalMatch = this.data.matches.find(match => match.stage === 'final');
    const thirdPlaceAssigned = !!(thirdPlaceMatch && thirdPlaceMatch.status === 'completed');
    const firstSecondAssigned = !!(finalMatch && finalMatch.status === 'completed');
    const groupStageWinner = groupStageAssigned ? this.getGroupStagePrizeWinner() : null;

    return [
      {
        title: '1st Place Finisher',
        amount: prizePool * payoutShares.first,
        assigned: firstSecondAssigned,
        winner: firstSecondAssigned && rankedPlayers[0] ? rankedPlayers[0].name : null,
        info: 'Assigned when the final is completed.'
      },
      {
        title: '2nd Place Finisher',
        amount: prizePool * payoutShares.second,
        assigned: firstSecondAssigned,
        winner: firstSecondAssigned && rankedPlayers[1] ? rankedPlayers[1].name : null,
        info: 'Assigned when the final is completed.'
      },
      {
        title: '3rd Place Finisher',
        amount: prizePool * payoutShares.third,
        assigned: thirdPlaceAssigned,
        winner: thirdPlaceAssigned && rankedPlayers[2] ? rankedPlayers[2].name : null,
        info: 'Assigned when the 3rd-place playoff is completed.'
      },
      {
        title: 'Most Group Stage Points',
        amount: prizePool * payoutShares.group,
        assigned: groupStageAssigned && !!groupStageWinner,
        winner: groupStageAssigned && groupStageWinner ? `${groupStageWinner.winnerName} (${groupStageWinner.points} pts)` : null,
        info: groupStageWinner && groupStageWinner.tieBreakApplied
          ? 'Tie-break applied: first player to reach the top score wins.'
          : 'Assigned when the tournament enters the Round of 32.'
      }
    ];
  }

  formatRand(amount) {
    return `R${Math.round(amount).toLocaleString('en-ZA')}`;
  }

  getFootballEmoji() {
    return String.fromCodePoint(0x26BD, 0xFE0F);
  }

  getFallbackFlagEmoji() {
    return String.fromCodePoint(0x1F3F4);
  }

  getSiteBaseUrl() {
    return new URL('./', window.location.href).href;
  }

  getTeamOwnerName(teamName) {
    const owner = this.getTeamPlayerObjects(teamName)[0];
    return owner ? owner.name : 'Unassigned';
  }

  getCompletedMatchesInLast24Hours() {
    const now = this.getCurrentDateAndTime();
    const cutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    return this.data.matches
      .filter(match => match.status === 'completed' && new Date(match.date) >= cutoff && new Date(match.date) <= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  formatShareTeam(teamName) {
    const flag = countryFlags[teamName] || this.getFallbackFlagEmoji();
    const ownerName = this.getTeamOwnerName(teamName);
    return `${flag} ${teamName} (${ownerName})`;
  }

  formatWhatsAppBold(text) {
    return `*${text}*`;
  }

  formatShareCenteredScore(scoreText, width) {
    const targetWidth = Math.max(width || 0, scoreText.length);
    const leftPadding = Math.floor((targetWidth - scoreText.length) / 2);
    return `${' '.repeat(leftPadding)}${scoreText}`;
  }

  formatShareMatchBlock(match) {
    const homeLine = this.formatShareTeam(match.home.team);
    const awayLine = this.formatShareTeam(match.away.team);
    const scoreLine = `${match.score.home} - ${match.score.away}`;
    const contentWidth = Math.max(homeLine.length, awayLine.length, scoreLine.length);
    const centeredScoreLine = this.formatShareCenteredScore(this.formatWhatsAppBold(scoreLine), contentWidth);

    return [homeLine, centeredScoreLine, awayLine].join('\n');
  }

  formatLeaderboardMovement(movement) {
    if (movement > 0) return `(+${movement})`;
    if (movement < 0) return `(${movement})`;
    return '(0)';
  }

  buildLatestResultsShareText() {
    const siteUrl = this.getSiteBaseUrl();
    const recentMatches = this.getCompletedMatchesInLast24Hours();
    const ranked = this.getRankedPlayers().slice(0, 3);
    const movements = this.getLeaderboardMovements();
    const matchLines = [];

    matchLines.push(`${this.getFootballEmoji()} FIFA Football Fever Latest 24 Hour Results`);
    matchLines.push('');

    if (recentMatches.length === 0) {
      matchLines.push('No completed matches in the last 24 hours.');
    } else {
      let lastDateLabel = '';
      for (const match of recentMatches) {
        const dateLabel = new Date(match.date).toLocaleDateString('en-ZA', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
        if (dateLabel !== lastDateLabel) {
          matchLines.push(this.formatWhatsAppBold(dateLabel));
          lastDateLabel = dateLabel;
        }

        matchLines.push(this.formatShareMatchBlock(match));
        matchLines.push('');
      }
    }

    matchLines.push('');
    matchLines.push(this.formatWhatsAppBold('Leaderboard Top 3:'));

    ranked.forEach((player, index) => {
      const movement = movements[player.name] ?? 0;
      matchLines.push(`${index + 1}. ${player.name} (${player.wins}W ${player.draws}D ${player.losses}L) ${player.groupStagePoints} PTS ${this.formatLeaderboardMovement(movement)}`);
    });

    matchLines.push('');
    matchLines.push(`Follow the action: ${siteUrl}`);

    return matchLines.join('\n');
  }

  shareLatestResults() {
    const shareText = this.buildLatestResultsShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  }

   renderMatchCard(match) {
      const displayStatus = this.getDisplayMatchStatus(match);
      const hasScore = this.hasVisibleScore(match);
      const homeFlag = countryFlags[match.home.team] || '🏴';
     const awayFlag = countryFlags[match.away.team] || '🏴';
     const dateObj = new Date(match.date);
     const dateStr = dateObj.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
     const timeStr = dateObj.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

     const { homePlayers, awayPlayers, homePlayerIds, awayPlayerIds, homePlayerObjects, awayPlayerObjects } = this.getPlayersForMatch(match);
     const homePlayersStr = homePlayers.length ? homePlayers.join(', ') : 'No one';
     const awayPlayersStr = awayPlayers.length ? awayPlayers.join(', ') : 'No one';

      // Build player avatars HTML
      const homeAvatarsHtml = homePlayerObjects.map(p => {
        const avatarImg = p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-size: 1.2rem; font-weight: bold;">${p.name.charAt(0)}</span>`;
        return `<div class="match-avatar-small" title="${p.name}">${avatarImg}</div>`;
      }).join('');

      const awayAvatarsHtml = awayPlayerObjects.map(p => {
        const avatarImg = p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-size: 1.2rem; font-weight: bold;">${p.name.charAt(0)}</span>`;
        return `<div class="match-avatar-small" title="${p.name}">${avatarImg}</div>`;
      }).join('');

     let stageName = match.stage.replace(/_/g, ' ').toUpperCase();
     if (match.stage === 'group' && match.group) {
       stageName = `GROUP ${match.group}`;
     }

     return `
       <div class="match-card" onclick="app.showMatchDetail('${match.id}')">
         <div class="match-header">
           <span class="match-stage">${stageName}</span>
            <span class="match-status ${displayStatus}">${this.formatMatchStatus(displayStatus)}</span>
           <div style="font-size: 0.85rem; margin-top: 0.5rem;">${dateStr} at ${timeStr}</div>
         </div>
         <div class="match-body">
           <div class="team-info">
             <div class="team-flag">${homeFlag}</div>
             <div class="team-avatars-row">${homeAvatarsHtml}</div>
             <div class="team-name">${match.home.team}</div>
             <div class="team-players">${homePlayersStr}</div>
           </div>
           <div class="score-display">
              ${hasScore ? `
                <div class="score-line">${match.score.home} - ${match.score.away}</div>
                <div class="vs-text">vs</div>
             ` : `
               <div class="vs-text">vs</div>
             `}
           </div>
           <div class="team-info">
             <div class="team-flag">${awayFlag}</div>
             <div class="team-avatars-row">${awayAvatarsHtml}</div>
             <div class="team-name">${match.away.team}</div>
             <div class="team-players">${awayPlayersStr}</div>
           </div>
         </div>
         <div class="match-footer">${match.venue}</div>
       </div>
     `;
   }

   showLanding(updateHash = true) {
     this.closePage();
     const page = document.getElementById('landingPage');

     if (updateHash) {
       this.setHash('home');
     }

     // Current stage
     const currentStage = this.getCurrentStage();
     const stageNames = {
       'group': 'Group Stage',
       'round_of_32': 'Round of 32',
       'round_of_16': 'Round of 16',
       'quarter_final': 'Quarterfinals',
       'semi_final': 'Semifinals',
       'third_place': '3rd Place Match',
       'final': 'Final'
     };
     document.getElementById('currentStageDisplay').innerHTML = `<div class="stage-display">${stageNames[currentStage]}</div>`;

     // Next match
     const nextMatch = this.getNextMatch();
     document.getElementById('nextMatchDisplay').innerHTML = this.renderMatchCard(nextMatch);
     this.startNextMatchCountdown(nextMatch);

    // Schedule by date
    const matchesByDate = {};
    for (let match of this.data.matches) {
      const date = new Date(match.date).toLocaleDateString('en-ZA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      if (!matchesByDate[date]) matchesByDate[date] = [];
      matchesByDate[date].push(match);
    }

    let scheduleHtml = '';
    for (let [date, matches] of Object.entries(matchesByDate)) {
      scheduleHtml += `<div class="schedule-day"><h4>${date}</h4>`;
      for (let match of matches) {
        scheduleHtml += this.renderMatchCard(match);
      }
      scheduleHtml += '</div>';
    }
    document.getElementById('scheduleList').innerHTML = scheduleHtml;

    // Top 3 players
    const ranked = this.getRankedPlayers();
    let topHtml = '';
    for (let i = 0; i < Math.min(3, ranked.length); i++) {
      const player = ranked[i];
      topHtml += this.renderPlayerCard(player, i + 1);
    }
    document.getElementById('topPlayersDisplay').innerHTML = topHtml;

    page.classList.remove('hidden');
    this.currentPage = 'landing';
  }

  renderPlayerCard(player, rank) {
    const initials = playerInitials[player.name] || player.name.charAt(0);
    const playerData = this.data.players.find(p => p.name === player.name);
    const avatarUrl = playerData ? playerData.avatarUrl : null;
    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="${player.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
      : `<span>${initials}</span>`;
    return `
      <div class="player-card" onclick="app.showPlayerDetail('${player.name}')">
        <div class="player-rank">${rank}</div>
        <div class="player-avatar">${avatarHtml}</div>
        <div class="player-name">${player.name}</div>
        <div class="player-score">${player.groupStagePoints} pts</div>
        <div class="player-teams">from ${player.teamsRemaining} teams still active</div>
        <span class="team-count">${player.wins}W ${player.draws}D ${player.losses}L</span>
      </div>
    `;
  }

   renderLeaderboardTable(ranked, movements, showTeamsRemaining) {
     let leaderboardHtml = '';
     for (let i = 0; i < ranked.length; i++) {
       const player = ranked[i];
       const initials = playerInitials[player.name] || player.name.charAt(0);
       const playerData = this.data.players.find(p => p.name === player.name);
       const avatarUrl = playerData ? playerData.avatarUrl : null;
       const avatarHtml = avatarUrl
         ? `<img src="${avatarUrl}" alt="${player.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
         : `<span>${initials}</span>`;
       const topClass = i < 3 ? `top-${i + 1}` : '';
       const rankClass = i < 3 ? `top-${i + 1}` : '';

       const movement = movements[player.name] ?? 0;
       let movementBadge;
       if (movement > 0) {
         movementBadge = `<span class="lb-movement up">▲ ${movement}</span>`;
       } else if (movement < 0) {
         movementBadge = `<span class="lb-movement down">▼ ${Math.abs(movement)}</span>`;
       } else {
         movementBadge = `<span class="lb-movement neutral">—</span>`;
       }

       leaderboardHtml += `
         <div class="leaderboard-row ${topClass}">
           <div class="rank ${rankClass}"></div>
           <div class="leaderboard-player" onclick="app.showPlayerDetail('${player.name}'); event.stopPropagation();">
             <div class="leaderboard-avatar">${avatarHtml}</div>
             <div class="leaderboard-name">
               <div class="leaderboard-name-text">${player.name}</div>
               ${showTeamsRemaining ? `<div class="leaderboard-teams-remaining">${player.teamsRemaining} teams remaining</div>` : ''}
             </div>
           </div>
           <div class="lb-stats">
             <div class="lb-stat-cell lb-stat-header">W</div>
             <div class="lb-stat-cell lb-stat-header">D</div>
             <div class="lb-stat-cell lb-stat-header">L</div>
             <div class="lb-stat-cell lb-stat-header">PTS</div>
             <div class="lb-stat-cell">${player.wins}</div>
             <div class="lb-stat-cell">${player.draws}</div>
             <div class="lb-stat-cell">${player.losses}</div>
             <div class="lb-stat-cell lb-stat-pts">${player.groupStagePoints}</div>
           </div>
           ${movementBadge}
         </div>
       `;
     }
     return leaderboardHtml;
   }

   showLeaderboard(updateHash = true) {
     this.closePage();
     const page = document.getElementById('leaderboardPage');

     if (updateHash) {
       this.setHash('leaderboard');
     }

     const currentStage = this.getCurrentStage();
     const stageNames = {
       'group': 'Group Stage',
       'round_of_32': 'Round of 32',
       'round_of_16': 'Round of 16',
       'quarter_final': 'Quarterfinals',
       'semi_final': 'Semifinals',
       'third_place': '3rd Place Match',
       'final': 'Final'
     };

     document.getElementById('leaderboardStage').textContent = `Current Stage: ${stageNames[currentStage]}`;

     const showTeamsRemaining = currentStage !== 'group';
     const completedMatches = this.getCompletedGroupMatches();

     // Initialize timeline index if not set
     if (this.leaderboardTimelineIndex === null) {
       this.leaderboardTimelineIndex = completedMatches.length - 1;
     }

     // Ensure index is valid
     if (completedMatches.length === 0) {
       document.getElementById('leaderboardDisplay').innerHTML = '<p>No completed matches yet</p>';
       page.classList.remove('hidden');
       this.currentPage = 'leaderboard';
       return;
     }

      // Render timeline control
     let timelineControlHtml = '';
     if (completedMatches.length > 0) {
       const currentIndex = Math.min(this.leaderboardTimelineIndex, completedMatches.length - 1);
       const match = completedMatches[currentIndex];
       const homeFlag = countryFlags[match.home.team] || '🏴';
       const awayFlag = countryFlags[match.away.team] || '🏴';
       const hasScore = this.hasVisibleScore(match);
       const scoreText = hasScore ? `${match.score.home} - ${match.score.away}` : 'TBD';
       const matchDateObj = new Date(match.date);
       const matchDateStr = matchDateObj.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: '2-digit' });

       timelineControlHtml = `
         <div class="leaderboard-timeline-control">
            <button class="timeline-toggle-btn ${this.leaderboardTimelineExpanded ? 'expanded' : ''}" onclick="app.toggleLeaderboardTimeline()">
             <span class="timeline-toggle-icon">⏱️</span>
             <span class="timeline-toggle-text">View Match Progress</span>
             <span class="timeline-toggle-arrow">▼</span>
           </button>
            <div class="leaderboard-timeline-panel ${this.leaderboardTimelineExpanded ? '' : 'hidden'}" id="leaderboardTimelinePanel">
             <div class="timeline-match-info">
                <div class="timeline-match-header" id="leaderboardTimelineCounter">Match ${currentIndex + 1} / ${completedMatches.length}</div>
               <div class="timeline-match-display">
                 <div class="timeline-team">
                    <span class="timeline-flag" id="leaderboardTimelineHomeFlag">${homeFlag}</span>
                    <span class="timeline-team-name" id="leaderboardTimelineHomeTeam">${match.home.team}</span>
                 </div>
                  <div class="timeline-score" id="leaderboardTimelineScore">${scoreText}</div>
                 <div class="timeline-team">
                    <span class="timeline-flag" id="leaderboardTimelineAwayFlag">${awayFlag}</span>
                    <span class="timeline-team-name" id="leaderboardTimelineAwayTeam">${match.away.team}</span>
                 </div>
               </div>
                <div class="timeline-match-date" id="leaderboardTimelineDate">${matchDateStr}</div>
             </div>
             <div class="timeline-controls">
                <button id="leaderboardTimelineFirstBtn" class="timeline-btn" onclick="app.jumpToLeaderboardMatch(0)" title="Jump to first match" aria-label="Jump to first match"><span class="timeline-btn-icon">⏮</span><span class="timeline-btn-label">First</span></button>
                <button id="leaderboardTimelinePrevBtn" class="timeline-btn" onclick="app.prevLeaderboardMatch()" title="Previous match" aria-label="Previous match"><span class="timeline-btn-icon">◀</span><span class="timeline-btn-label">Back</span></button>
               <input type="range" id="leaderboardMatchSlider" class="timeline-slider" min="0" max="${completedMatches.length - 1}" value="${currentIndex}" onchange="app.jumpToLeaderboardMatch(parseInt(this.value))">
                <button id="leaderboardTimelineNextBtn" class="timeline-btn" onclick="app.nextLeaderboardMatch()" title="Next match" aria-label="Next match"><span class="timeline-btn-icon">▶</span><span class="timeline-btn-label">Forward</span></button>
                <button id="leaderboardTimelineLatestBtn" class="timeline-btn" onclick="app.jumpToLeaderboardMatch(${completedMatches.length - 1})" title="Jump to latest match" aria-label="Jump to latest match"><span class="timeline-btn-icon">⏭</span><span class="timeline-btn-label">Latest</span></button>
             </div>
           </div>
         </div>
       `;
     }

     // Get leaderboard at current timeline point
     const rankedAtIndex = this.getLeaderboardAtMatchIndex(this.leaderboardTimelineIndex);
     let movements = {};
     if (this.leaderboardTimelineIndex > 0) {
       movements = this.getMovementsBetweenMatches(this.leaderboardTimelineIndex - 1, this.leaderboardTimelineIndex);
     }

     const leaderboardHtml = this.renderLeaderboardTable(rankedAtIndex, movements, showTeamsRemaining);

     document.getElementById('leaderboardDisplay').innerHTML = timelineControlHtml + '<div id="leaderboardTableContainer" class="leaderboard-table">' + leaderboardHtml + '</div>';
      this.updateLeaderboardTimelineContent();
     page.classList.remove('hidden');
     this.currentPage = 'leaderboard';
   }

   toggleLeaderboardTimeline() {
     this.leaderboardTimelineExpanded = !this.leaderboardTimelineExpanded;
     const panel = document.getElementById('leaderboardTimelinePanel');
     const button = document.querySelector('.timeline-toggle-btn');
     if (panel) {
       panel.classList.toggle('hidden', !this.leaderboardTimelineExpanded);
     }
     if (button) {
       button.classList.toggle('expanded', this.leaderboardTimelineExpanded);
     }
   }

   nextLeaderboardMatch() {
     const completedMatches = this.getCompletedGroupMatches();
     if (this.leaderboardTimelineIndex < completedMatches.length - 1) {
       this.leaderboardTimelineIndex++;
       this.updateLeaderboardTimelineContent();
     }
   }

   prevLeaderboardMatch() {
     if (this.leaderboardTimelineIndex > 0) {
       this.leaderboardTimelineIndex--;
       this.updateLeaderboardTimelineContent();
     }
   }

   jumpToLeaderboardMatch(index) {
     const completedMatches = this.getCompletedGroupMatches();
     if (index >= 0 && index < completedMatches.length) {
       this.leaderboardTimelineIndex = index;
       this.updateLeaderboardTimelineContent();
     }
   }

   showMatches(preselectedTeam = null, updateHash = true) {
     this.closePage();
     const page = document.getElementById('matchesPage');
     const filtersPanel = document.getElementById('filtersToggle');
     const filtersToggleButton = document.getElementById('filtersToggleButton');

     if (updateHash) {
       if (preselectedTeam) {
         this.setHash(`matches?team=${encodeURIComponent(preselectedTeam)}`);
       } else {
         this.setHash('matches');
       }
     }

     // Initialize filters
     this.initializeMatchFilters();

     if (preselectedTeam) {
       document.getElementById('teamFilter').value = preselectedTeam;
       filtersPanel.classList.remove('hidden');
       filtersToggleButton.textContent = 'Hide Filters ▲';
     } else {
       filtersPanel.classList.add('hidden');
       filtersToggleButton.textContent = 'Show Filters ▼';
     }

     // Apply filters to display matches
     this.applyMatchFilters();

     page.classList.remove('hidden');
     this.currentPage = 'matches';
   }

   showTeams(updateHash = true) {
     this.closePage();
     const page = document.getElementById('teamsPage');

     if (updateHash) {
       this.setHash('teams');
     }

      const teamPoints = this.calculateTeamGroupPoints();

      const groupedTeams = {};
      for (let team of this.data.teams) {
        if (!groupedTeams[team.group]) groupedTeams[team.group] = [];
        groupedTeams[team.group].push(team.name);
      }

      const sortedGroups = Object.keys(groupedTeams).sort();
      let html = '';

      for (let group of sortedGroups) {
        const teams = groupedTeams[group].slice().sort((a, b) => {
          const ptsDiff = (teamPoints[b] || 0) - (teamPoints[a] || 0);
          return ptsDiff !== 0 ? ptsDiff : a.localeCompare(b);
        });
       html += `
         <section class="group-card">
           <h3>Group ${group}</h3>
           <div class="group-teams-list">
             ${teams.map(teamName => {
               const teamFlag = countryFlags[teamName] || '🏴';
               const teamPlayers = this.getTeamPlayerObjects(teamName);
               const owner = teamPlayers.length ? teamPlayers[0] : null;
               const ownerInitial = owner ? (playerInitials[owner.name] || owner.name.charAt(0)) : '?';
               const ownerAvatar = owner
                 ? (owner.avatarUrl
                     ? `<img src="${owner.avatarUrl}" alt="${owner.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                     : `<span>${ownerInitial}</span>`)
                 : '<span>?</span>';
               const ownerName = owner ? owner.name : 'Unassigned';
                return `
                  <button class="team-chip" onclick="app.showMatchesByTeam('${encodeURIComponent(teamName)}')" aria-label="View matches for ${teamName}">
                    <span class="team-chip-main">${teamFlag} ${teamName} (${teamPoints[teamName] || 0})</span>
                   <span class="team-chip-owner">
                     <span class="team-chip-owner-name">${ownerName}</span>
                     <span class="team-chip-owner-avatar">${ownerAvatar}</span>
                   </span>
                 </button>
               `;
             }).join('')}
           </div>
         </section>
       `;
     }

     document.getElementById('teamsDisplay').innerHTML = html;
     page.classList.remove('hidden');
     this.currentPage = 'teams';
   }

   showMatchesByTeam(encodedTeamName, updateHash = true) {
     const teamName = decodeURIComponent(encodedTeamName);
     this.showMatches(teamName, updateHash);
   }

   showPlayerDetailByEncodedName(encodedPlayerName, updateHash = true) {
     const playerName = decodeURIComponent(encodedPlayerName);
     this.showPlayerDetail(playerName, updateHash);
   }

   showPrizes(updateHash = true) {
     this.closePage();
     const page = document.getElementById('prizesPage');

     if (updateHash) {
       this.setHash('prizes');
     }

     const prizeAssignments = this.getPrizeAssignments();

     let html = `
       <div class="prizes-grid">
     `;

     for (let prize of prizeAssignments) {
       const statusClass = prize.assigned ? 'assigned' : 'pending';
       const statusText = prize.assigned ? 'Assigned' : 'Pending';
       html += `
         <div class="prize-card">
           <div class="prize-header">
             <div class="prize-title">${prize.title}</div>
           </div>
           <div class="prize-share">${this.formatRand(prize.amount)}</div>
           <div class="prize-status ${statusClass}">${statusText}</div>
           <div class="prize-winner">${prize.winner ? prize.winner : 'TBD'}</div>
           <div class="prize-info">${prize.info}</div>
         </div>
       `;
     }

     html += '</div>';
     document.getElementById('prizesDisplay').innerHTML = html;
     page.classList.remove('hidden');
     this.currentPage = 'prizes';
   }

   initializeMatchFilters() {
     // Populate team filter
     const teamFilter = document.getElementById('teamFilter');
     // Clear existing options except the first one
     while (teamFilter.options.length > 1) {
       teamFilter.remove(1);
     }
     const teams = [...new Set(this.data.teams.map(t => t.name))];
     teams.sort();
     for (let team of teams) {
       const option = document.createElement('option');
       option.value = team;
       option.textContent = team;
       teamFilter.appendChild(option);
     }

     // Populate player filter
     const playerFilter = document.getElementById('playerFilter');
     // Clear existing options except the first one
     while (playerFilter.options.length > 1) {
       playerFilter.remove(1);
     }
     const players = this.data.players.map(p => p.name);
     players.sort();
     for (let player of players) {
       const option = document.createElement('option');
       option.value = player;
       option.textContent = player;
       playerFilter.appendChild(option);
     }

     // Reset all filters
     document.getElementById('stageFilter').value = '';
     document.getElementById('statusFilter').value = '';
     document.getElementById('teamFilter').value = '';
     document.getElementById('playerFilter').value = '';
   }

   applyMatchFilters() {
     const stageFilter = document.getElementById('stageFilter').value;
     const statusFilter = document.getElementById('statusFilter').value;
     const teamFilter = document.getElementById('teamFilter').value;
     const playerFilter = document.getElementById('playerFilter').value;
     const matchesCountElement = document.getElementById('matchesCount');

     let filteredMatches = this.data.matches;

     // Filter by stage
     if (stageFilter) {
       filteredMatches = filteredMatches.filter(m => m.stage === stageFilter);
     }

     // Filter by status
     if (statusFilter) {
       filteredMatches = filteredMatches.filter(m => this.getDisplayMatchStatus(m) === statusFilter);
     }

     // Filter by team
     if (teamFilter) {
       filteredMatches = filteredMatches.filter(m =>
         m.home.team === teamFilter || m.away.team === teamFilter
       );
     }

     // Filter by player
     if (playerFilter) {
       filteredMatches = filteredMatches.filter(m => {
         const homePlayerIds = this.getTeamPlayerIds(m.home.team);
         const awayPlayerIds = this.getTeamPlayerIds(m.away.team);
         const playerObj = this.data.players.find(p => p.name === playerFilter);
         if (!playerObj) return false;
         return homePlayerIds.includes(playerObj.id) || awayPlayerIds.includes(playerObj.id);
       });
     }

     // Render filtered matches
     let html = '';
     if (filteredMatches.length === 0) {
       html = '<div style="text-align: center; padding: 2rem; color: #666;">No matches found matching the selected filters.</div>';
     } else {
       for (let match of filteredMatches) {
         html += this.renderMatchCard(match);
       }
     }

     const matchWord = filteredMatches.length === 1 ? 'match' : 'matches';
     matchesCountElement.textContent = `Showing ${filteredMatches.length} ${matchWord}`;
     document.getElementById('matchesDisplay').innerHTML = html;
   }

  showPlayerDetail(playerName, updateHash = true) {
    this.closePage();
    const page = document.getElementById('playerPage');

    if (updateHash) {
      this.setHash(`player/${encodeURIComponent(playerName)}`);
    }

    const player = this.data.players.find(p => p.name === playerName);
    if (!player) return;

    const scores = this.calculatePlayerScores();
    const playerScore = scores[player.id];
    const initials = playerInitials[playerName] || playerName.charAt(0);
    const avatarUrl = player.avatarUrl;
    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="${playerName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
      : `<span>${initials}</span>`;

    // Get player's matches
    const playerMatches = [];
    for (let match of this.data.matches) {
      const homeIds = this.getTeamPlayerIds(match.home.team);
      const awayIds = this.getTeamPlayerIds(match.away.team);
      if (homeIds.includes(player.id) || awayIds.includes(player.id)) {
        playerMatches.push(match);
      }
    }

    let teamsHtml = '';
    for (let teamName of player.teams) {
      const flag = countryFlags[teamName] || '🏴';
      const teamMatches = playerMatches.filter(m => m.home.team === teamName || m.away.team === teamName);
      const isActive = teamMatches.some(m => m.status === 'completed' && m.winner !== null) ||
                       teamMatches.some(m => m.status === 'scheduled');
      const isEliminated = teamMatches.some(m => m.status === 'completed' && m.winner !== null && !isActive);

      const status = isActive ? 'active' : isEliminated ? 'eliminated' : 'pending';
      const statusText = isActive ? 'Active' : isEliminated ? 'Eliminated' : 'Pending';

      teamsHtml += `
        <div class="team-box">
          <div class="team-box-flag">${flag}</div>
          <div class="team-box-name">${teamName}</div>
          <span class="team-box-status ${status}">${statusText}</span>
        </div>
      `;
    }

    let matchesHtml = '';
    for (let match of playerMatches) {
      if (match.stage === 'group') {
        const homeFlag = countryFlags[match.home.team] || '🏴';
        const awayFlag = countryFlags[match.away.team] || '🏴';
        const dateObj = new Date(match.date);
        const dateStr = dateObj.toLocaleDateString('en-ZA');

        let resultHtml = '';
        if (this.hasVisibleScore(match)) {
          resultHtml = `${match.score.home} - ${match.score.away}`;
        } else {
          resultHtml = 'TBD';
        }

        const displayStatus = this.getDisplayMatchStatus(match);

        matchesHtml += `
          <div class="match-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: #666;">${dateStr}</span>
                <span class="match-status ${displayStatus}">${this.formatMatchStatus(displayStatus)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">${homeFlag}</div>
                <div style="font-weight: 600; font-size: 0.9rem;">${match.home.team}</div>
              </div>
              <div style="text-align: center; margin: 0 1rem;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #1a472a;">${resultHtml}</div>
              </div>
              <div style="flex: 1; text-align: right;">
                <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">${awayFlag}</div>
                <div style="font-weight: 600; font-size: 0.9rem;">${match.away.team}</div>
              </div>
            </div>
          </div>
        `;
      }
    }

    const html = `
      <div class="player-detail">
        <div class="player-header">
          <div class="player-header-avatar">${avatarHtml}</div>
          <h1>${playerName}</h1>
          <p>Team Selector</p>
        </div>
        <div class="player-stats">
          <div class="stat-box">
            <span class="stat-value">${playerScore.groupStagePoints}</span>
            <span class="stat-label">Group Points</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${playerScore.teamsRemaining}</span>
            <span class="stat-label">Teams Remaining</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${playerScore.wins}</span>
            <span class="stat-label">Wins</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${playerScore.draws}</span>
            <span class="stat-label">Draws</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${playerScore.losses}</span>
            <span class="stat-label">Losses</span>
          </div>
        </div>
        <div class="player-teams-section">
          <h3>Teams</h3>
          <div class="teams-list">${teamsHtml}</div>
        </div>
        <div class="player-matches">
          <h3>Group Stage Matches</h3>
          <div class="player-match-list">${matchesHtml}</div>
        </div>
      </div>
    `;

    document.getElementById('playerDetails').innerHTML = html;
    page.classList.remove('hidden');
    this.currentPage = 'playerDetail';
  }

   showMatchDetail(matchId, updateHash = true) {
     this.closePage();
     const page = document.getElementById('matchDetailPage');

     if (updateHash) {
       this.setHash(`match/${encodeURIComponent(matchId)}`);
     }

     const match = this.data.matches.find(m => m.id === matchId);
     if (!match) return;
     const displayStatus = this.getDisplayMatchStatus(match);
     const hasScore = this.hasVisibleScore(match);

     const homeFlag = countryFlags[match.home.team] || '🏴';
     const awayFlag = countryFlags[match.away.team] || '🏴';
     const dateObj = new Date(match.date);
     const dateStr = dateObj.toLocaleDateString('en-ZA', {
       weekday: 'long',
       month: 'long',
       day: 'numeric',
       year: 'numeric'
     });
     const timeStr = dateObj.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

     let stageName = match.stage.replace(/_/g, ' ').toUpperCase();
     if (match.stage === 'group' && match.group) {
       stageName = `GROUP ${match.group}`;
     }
     const { homePlayers, awayPlayers, homePlayerIds, awayPlayerIds, homePlayerObjects, awayPlayerObjects } = this.getPlayersForMatch(match);

      // Build home team avatars HTML
      const homeAvatarsHtml = homePlayerObjects.map(p => {
        const avatarImg = p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-size: 1.5rem; font-weight: bold;">${p.name.charAt(0)}</span>`;
        return `<button type="button" class="match-detail-avatar match-detail-avatar-clickable" title="${p.name}" aria-label="View ${p.name} details" onclick="app.showPlayerDetailByEncodedName('${encodeURIComponent(p.name)}')">${avatarImg}</button>`;
      }).join('');

      // Build away team avatars HTML
      const awayAvatarsHtml = awayPlayerObjects.map(p => {
        const avatarImg = p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-size: 1.5rem; font-weight: bold;">${p.name.charAt(0)}</span>`;
        return `<button type="button" class="match-detail-avatar match-detail-avatar-clickable" title="${p.name}" aria-label="View ${p.name} details" onclick="app.showPlayerDetailByEncodedName('${encodeURIComponent(p.name)}')">${avatarImg}</button>`;
      }).join('');

     const html = `
       <div style="background: white; border-radius: 10px; padding: 2rem;">
         <div style="background: linear-gradient(135deg, #1a472a 0%, #003f7f 100%); color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; text-align: center;">
           <div style="font-size: 0.9rem; margin-bottom: 1rem;">
             <span style="background: #ffd700; color: #1a472a; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600;">${stageName}</span>
           </div>
           <p style="margin-bottom: 1rem;">${dateStr}</p>
           <p>${timeStr} at ${match.venue}</p>
         </div>

         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
           <div style="text-align: center;">
             <div style="font-size: 3rem; margin-bottom: 0.5rem;">${homeFlag}</div>
             <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
               ${homeAvatarsHtml}
             </div>
             <h2 style="color: #1a472a; margin: 0.5rem 0;">${match.home.team}</h2>
             <div style="color: #666; font-size: 0.9rem;">${homePlayers.join(', ') || 'No one'}</div>
           </div>
           <div style="text-align: center;">
             <div style="font-size: 3rem; margin-bottom: 0.5rem;">${awayFlag}</div>
             <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
               ${awayAvatarsHtml}
             </div>
             <h2 style="color: #1a472a; margin: 0.5rem 0;">${match.away.team}</h2>
             <div style="color: #666; font-size: 0.9rem;">${awayPlayers.join(', ') || 'No one'}</div>
           </div>
         </div>

          ${hasScore ? `
           <div style="background: #f0f0f0; padding: 2rem; border-radius: 10px; text-align: center; margin-bottom: 2rem;">
              <p style="color: #666; margin-bottom: 1rem;">${displayStatus === 'completed' ? 'Final Score' : 'Current Score'}</p>
             <div style="font-size: 3rem; font-weight: bold; color: #003f7f; display: flex; justify-content: center; align-items: center; gap: 1rem;">
               <span>${match.score.home}</span>
               <span style="font-size: 1.5rem; color: #666;">-</span>
               <span>${match.score.away}</span>
             </div>
             <p style="margin-top: 1rem; color: #666;">
                ${displayStatus === 'in_progress' ? 'Match currently in progress' :
                  displayStatus === 'pending' ? 'Pending score confirmation' :
                  displayStatus === 'completed' ? (
                    match.winner === 'home' ? `${match.home.team} wins!` :
                    match.winner === 'away' ? `${match.away.team} wins!` :
                    'Match ended in a draw'
                  ) :
                  'Live score update'}
             </p>
           </div>
         ` : `
           <div style="background: #f0f0f0; padding: 2rem; border-radius: 10px; text-align: center;">
             <p style="color: #666;">Match not yet played</p>
           </div>
         `}
       </div>
     `;

     document.getElementById('matchDetailContent').innerHTML = html;
     page.classList.remove('hidden');
     this.currentPage = 'matchDetail';
   }

  closePage() {
    this.scrollToTop();
    this.stopNextMatchCountdown();
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('navMenu').classList.remove('active');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new WorldCupApp();
  });
} else {
  window.app = new WorldCupApp();
}
