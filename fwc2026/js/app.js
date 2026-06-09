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
    this.currentPage = 'landing';
    this.nextMatchCountdownInterval = null;
    this.init();
  }

  async init() {
    try {
      const cacheBust = window.__CACHE_BUST__ ? `?v=${encodeURIComponent(window.__CACHE_BUST__)}` : '';
      const response = await fetch(`tournament.json${cacheBust}`, { cache: 'no-store' });
      this.data = await response.json();
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

  calculatePlayerScores() {
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

    for (let match of this.data.matches) {
      if (match.stage !== 'group' || match.status !== 'completed') continue;

      const homePlayerIds = this.getTeamPlayerIds(match.home.team);
      const awayPlayerIds = this.getTeamPlayerIds(match.away.team);

      if (match.winner === 'home') {
        for (let pid of homePlayerIds) {
          scores[pid].groupStagePoints += 3;
          scores[pid].wins += 1;
        }
        for (let pid of awayPlayerIds) {
          scores[pid].losses += 1;
        }
      } else if (match.winner === 'away') {
        for (let pid of awayPlayerIds) {
          scores[pid].groupStagePoints += 3;
          scores[pid].wins += 1;
        }
        for (let pid of homePlayerIds) {
          scores[pid].losses += 1;
        }
      } else if (match.winner === 'draw') {
        for (let pid of [...homePlayerIds, ...awayPlayerIds]) {
          scores[pid].groupStagePoints += 1;
          scores[pid].draws += 1;
        }
      }

      for (let pid of [...homePlayerIds, ...awayPlayerIds]) {
        scores[pid].totalMatches += 1;
      }
    }

    return scores;
  }

  getRankedPlayers() {
    const scores = this.calculatePlayerScores();
    const currentStage = this.getCurrentStage();

    const ranked = Object.values(scores).sort((a, b) => {
      if (currentStage === 'group' || currentStage === 'final') {
        return b.groupStagePoints - a.groupStagePoints;
      }
      return b.teamsRemaining - a.teamsRemaining;
    });

    return ranked;
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

   renderMatchCard(match) {
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
           <span class="match-status ${match.status}">${match.status.charAt(0).toUpperCase() + match.status.slice(1)}</span>
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
             ${match.status === 'completed' ? `
               <div class="score-number">${match.score.home}</div>
               <div class="vs-text">vs</div>
               <div class="score-number">${match.score.away}</div>
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

  showLeaderboard(updateHash = true) {
    this.closePage();
    const page = document.getElementById('leaderboardPage');

    if (updateHash) {
      this.setHash('leaderboard');
    }

    const ranked = this.getRankedPlayers();

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

      leaderboardHtml += `
        <div class="leaderboard-row ${topClass}">
          <div class="rank ${rankClass}"></div>
          <div class="leaderboard-player" onclick="app.showPlayerDetail('${player.name}'); event.stopPropagation();">
            <div class="leaderboard-avatar">${avatarHtml}</div>
            <div class="leaderboard-name">
              <div class="leaderboard-name-text">${player.name}</div>
              <div class="leaderboard-teams-remaining">${player.teamsRemaining} teams remaining</div>
            </div>
          </div>
          <div class="leaderboard-score">
            <span class="leaderboard-score-value">${player.groupStagePoints}</span>
            <span class="leaderboard-score-label">Group Pts</span>
          </div>
          <div style="text-align: center; padding: 0.5rem;">
            <div style="font-weight: 600; color: #003f7f;">${player.wins}-${player.draws}-${player.losses}</div>
            <div style="font-size: 0.75rem; color: #666;">W-D-L</div>
          </div>
        </div>
      `;
    }
    document.getElementById('leaderboardDisplay').innerHTML = leaderboardHtml;
    page.classList.remove('hidden');
    this.currentPage = 'leaderboard';
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

     const groupedTeams = {};
     for (let team of this.data.teams) {
       if (!groupedTeams[team.group]) groupedTeams[team.group] = [];
       groupedTeams[team.group].push(team.name);
     }

     const sortedGroups = Object.keys(groupedTeams).sort();
     let html = '';

     for (let group of sortedGroups) {
       const teams = groupedTeams[group].slice().sort((a, b) => a.localeCompare(b));
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
                   <span class="team-chip-main">${teamFlag} ${teamName}</span>
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
       filteredMatches = filteredMatches.filter(m => m.status === statusFilter);
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
        if (match.status === 'completed') {
          resultHtml = `${match.score.home} - ${match.score.away}`;
        } else {
          resultHtml = 'TBD';
        }

        matchesHtml += `
          <div class="match-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: #666;">${dateStr}</span>
              <span class="match-status ${match.status}">${match.status === 'completed' ? 'Done' : 'Pending'}</span>
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
        return `<div class="match-detail-avatar" title="${p.name}">${avatarImg}</div>`;
      }).join('');

      // Build away team avatars HTML
      const awayAvatarsHtml = awayPlayerObjects.map(p => {
        const avatarImg = p.avatarUrl ? `<img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<span style="font-size: 1.5rem; font-weight: bold;">${p.name.charAt(0)}</span>`;
        return `<div class="match-detail-avatar" title="${p.name}">${avatarImg}</div>`;
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

         ${match.status === 'completed' ? `
           <div style="background: #f0f0f0; padding: 2rem; border-radius: 10px; text-align: center; margin-bottom: 2rem;">
             <p style="color: #666; margin-bottom: 1rem;">Final Score</p>
             <div style="font-size: 3rem; font-weight: bold; color: #003f7f; display: flex; justify-content: center; align-items: center; gap: 1rem;">
               <span>${match.score.home}</span>
               <span style="font-size: 1.5rem; color: #666;">-</span>
               <span>${match.score.away}</span>
             </div>
             <p style="margin-top: 1rem; color: #666;">
               ${match.winner === 'home' ? `${match.home.team} wins!` :
                 match.winner === 'away' ? `${match.away.team} wins!` :
                 'Match ended in a draw'}
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
