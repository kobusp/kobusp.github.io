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
    this.init();
  }

  async init() {
    try {
      const response = await fetch('tournament.json');
      this.data = await response.json();
      this.setupEventListeners();
      this.showLanding();
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
      if (new Date(match.date) >= now && match.status !== 'completed') {
        return match;
      }
    }
    return this.data.matches[this.data.matches.length - 1];
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

   renderMatchCard(match) {
     const homeFlag = countryFlags[match.home.team] || '🏴';
     const awayFlag = countryFlags[match.away.team] || '🏴';
     const dateObj = new Date(match.date);
     const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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

     const stageName = match.stage.replace(/_/g, ' ').toUpperCase();

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

   showLanding() {
     this.closePage();
     const page = document.getElementById('landingPage');

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

    // Schedule by date
    const matchesByDate = {};
    for (let match of this.data.matches) {
      const date = new Date(match.date).toLocaleDateString('en-US', {
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

  showLeaderboard() {
    this.closePage();
    const page = document.getElementById('leaderboardPage');
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

  showMatches() {
    this.closePage();
    const page = document.getElementById('matchesPage');
    let html = '';
    for (let match of this.data.matches) {
      html += this.renderMatchCard(match);
    }
    document.getElementById('matchesDisplay').innerHTML = html;
    page.classList.remove('hidden');
    this.currentPage = 'matches';
  }

  showPlayerDetail(playerName) {
    this.closePage();
    const page = document.getElementById('playerPage');
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
        const dateStr = dateObj.toLocaleDateString('en-US');

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

   showMatchDetail(matchId) {
     this.closePage();
     const page = document.getElementById('matchDetailPage');
     const match = this.data.matches.find(m => m.id === matchId);
     if (!match) return;

     const homeFlag = countryFlags[match.home.team] || '🏴';
     const awayFlag = countryFlags[match.away.team] || '🏴';
     const dateObj = new Date(match.date);
     const dateStr = dateObj.toLocaleDateString('en-US', {
       weekday: 'long',
       month: 'long',
       day: 'numeric',
       year: 'numeric'
     });
     const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

     const stageName = match.stage.replace(/_/g, ' ').toUpperCase();
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
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('navMenu').classList.remove('active');
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
