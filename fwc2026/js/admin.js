(() => {
  const STORAGE_KEY = 'fwc2026-admin-draft-v1';

  const state = {
	sourceData: null,
	draftData: null,
	selectedMatchId: null,
  };

  const elements = {};
  const {
	parseNullableInteger,
	inferWinnerFromScores,
	getDisplayMatchStatus,
	mergeMatchesWithResults,
	extractResultsData,
	hasPenaltyShootout,
	formatScoreText,
	buildUpdatedMatch: buildUpdatedMatchFromInputs,
  } = window.matchResultUtils || {};

  if (
	typeof parseNullableInteger !== 'function'
	|| typeof inferWinnerFromScores !== 'function'
	|| typeof getDisplayMatchStatus !== 'function'
	|| typeof mergeMatchesWithResults !== 'function'
	|| typeof extractResultsData !== 'function'
	|| typeof hasPenaltyShootout !== 'function'
	|| typeof formatScoreText !== 'function'
	|| typeof buildUpdatedMatchFromInputs !== 'function'
  ) {
	throw new Error('match-result-utils.js failed to load.');
  }

  function $(id) {
	return document.getElementById(id);
  }

  function clone(value) {
	return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(value) {
	return String(value || '')
	  .trim()
	  .toLowerCase();
  }

  function prettyStage(stage) {
	const labels = {
	  group: 'Group stage',
	  round_of_32: 'Round of 32',
	  round_of_16: 'Round of 16',
	  quarter_final: 'Quarter-finals',
	  semi_final: 'Semi-finals',
	  third_place: 'Third place',
	  final: 'Final',
	};

	return labels[stage] || stage || 'Unknown';
  }

  function prettyStatus(status) {
	if (!status) {
	  return 'Unknown';
	}

	if (status === 'in_progress') {
	  return 'In Progress';
	}

	return status
	  .split('_')
	  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
	  .join(' ');
  }

  function formatDateTime(value) {
	if (!value) {
	  return '—';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
	  return value;
	}

	return date.toLocaleString('en-ZA', {
	  weekday: 'short',
	  day: 'numeric',
	  month: 'short',
	  hour: '2-digit',
	  minute: '2-digit',
	});
  }

  function getMatchScoreText(match) {
	const scoreText = formatScoreText(match);
	return scoreText ? `Score: ${scoreText}` : 'Score: —';
  }

  function getMatchWinnerOptions(match) {
	const homeName = match?.home?.team || 'Home';
	const awayName = match?.away?.team || 'Away';
	const options = [
	  { value: '', label: 'Unset' },
	  { value: 'home', label: `${homeName} win` },
	  { value: 'away', label: `${awayName} win` },
	];

	if (match?.stage === 'group') {
	  options.splice(1, 0, { value: 'draw', label: 'Draw' });
	}

	return options;
  }

  function areMatchesEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
  }

  function getChangedMatches() {
	if (!state.sourceData || !state.draftData) {
	  return [];
	}

	const sourceMatches = new Map(state.sourceData.matches.map(match => [match.id, match]));
	return state.draftData.matches.filter(match => !areMatchesEqual(match, sourceMatches.get(match.id)));
  }

  function setStatus(message, kind = '') {
	const statusBar = elements.statusBar;
	statusBar.textContent = message;
	statusBar.classList.remove('error', 'success');
	if (kind) {
	  statusBar.classList.add(kind);
	}
  }

  function showNotice(message, kind = '') {
	const notice = elements.editorNotice;
	notice.hidden = false;
	notice.textContent = message;
	notice.className = `notice${kind ? ` ${kind}` : ''}`;
  }

  function hideNotice() {
	elements.editorNotice.hidden = true;
	elements.editorNotice.textContent = '';
	elements.editorNotice.className = 'notice';
  }

  function syncSummary() {
	const changedMatches = getChangedMatches();
	const draftMatches = state.draftData?.matches || [];

	const completedCount = draftMatches.filter(match => getDisplayMatchStatus(match) === 'completed').length;
	const inProgressCount = draftMatches.filter(match => getDisplayMatchStatus(match) === 'in_progress').length;

	const values = [
	  draftMatches.length,
	  completedCount,
	  inProgressCount,
	  changedMatches.length,
	];

	elements.summaryGrid.querySelectorAll('.summary-tile .value').forEach((node, index) => {
	  node.textContent = String(values[index]);
	});
  }

  function getFilteredMatches() {
	const query = normalizeText(elements.searchInput.value);
	const stageFilter = elements.stageFilter.value;
	const statusFilter = elements.statusFilter.value;

	return (state.draftData?.matches || []).filter(match => {
	  const searchable = normalizeText([
		match.id,
		match.stage,
		prettyStage(match.stage),
		match.group || '',
		match.home?.team || '',
		match.away?.team || '',
		match.venue || '',
	  ].join(' '));

	  if (stageFilter !== 'all' && match.stage !== stageFilter) {
		return false;
	  }

	  if (statusFilter !== 'all' && getDisplayMatchStatus(match) !== statusFilter) {
		return false;
	  }

	  if (query && !searchable.includes(query)) {
		return false;
	  }

	  return true;
	});
  }

  function renderMatchList() {
	const matches = getFilteredMatches();
	const selectedId = state.selectedMatchId;

	elements.matchCount.textContent = `Showing ${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;
	elements.matchList.innerHTML = matches.map(match => {
	  const active = match.id === selectedId ? 'active' : '';
	  const displayStatus = getDisplayMatchStatus(match);
	  const statusClass = displayStatus || 'scheduled';
	  const winnerText = displayStatus === 'completed'
		? (match.winner === 'draw'
		  ? 'Draw'
		  : match.winner === 'home'
			? `${match.home.team} won${hasPenaltyShootout(match) ? ' (penalties)' : ''}`
			: match.winner === 'away'
			  ? `${match.away.team} won${hasPenaltyShootout(match) ? ' (penalties)' : ''}`
			  : 'Winner unset')
		: displayStatus === 'in_progress'
		  ? 'Live now'
		  : displayStatus === 'pending'
			? 'Pending score update'
			: 'Not completed';

	  return `
		<button type="button" class="match-item ${active}" data-match-id="${match.id}">
		  <div class="topline">
			<span>${match.id} • ${prettyStage(match.stage)}${match.group ? ` • Group ${match.group}` : ''}</span>
			<span class="pill ${statusClass}">${prettyStatus(displayStatus)}</span>
		  </div>
		  <div class="teams">${match.home.team} vs ${match.away.team}</div>
		  <div class="topline">
			<span>${formatDateTime(match.date)}</span>
			<span>${winnerText}</span>
		  </div>
		  <div class="score">${getMatchScoreText(match)}</div>
		</button>
	  `;
	}).join('');

	elements.matchList.querySelectorAll('[data-match-id]').forEach(button => {
	  button.addEventListener('click', () => selectMatch(button.dataset.matchId));
	});

	syncSummary();
  }

  function renderWinnerOptions(match) {
	elements.winnerSelect.innerHTML = getMatchWinnerOptions(match)
	  .map(option => `<option value="${option.value}">${option.label}</option>`)
	  .join('');
  }

  function setEditorVisibility(visible) {
	elements.editorEmpty.hidden = visible;
	elements.editorForm.classList.toggle('hidden', !visible);
  }

  function updatePenaltyFieldVisibility(match) {
	const status = elements.statusSelect.value;
	const isKnockout = match?.stage !== 'group';
	const showPenalties = status === 'completed' && isKnockout;

	elements.homePenaltyField.classList.toggle('hidden', !showPenalties);
	elements.awayPenaltyField.classList.toggle('hidden', !showPenalties);

	if (!showPenalties) {
	  elements.homePenalty.value = '';
	  elements.awayPenalty.value = '';
	}
  }

  function updateValidationPreview(matchOverride = null) {
	const match = matchOverride || state.draftData.matches.find(item => item.id === state.selectedMatchId);
	if (!match) {
	  elements.matchNotes.value = 'Select a match to see validation details.';
	  return;
	}

	updatePenaltyFieldVisibility(match);

	const homeScore = parseNullableInteger(elements.homeScore.value);
	const awayScore = parseNullableInteger(elements.awayScore.value);
	const homePenalties = parseNullableInteger(elements.homePenalty.value);
	const awayPenalties = parseNullableInteger(elements.awayPenalty.value);
	const status = elements.statusSelect.value;
	const winner = elements.winnerSelect.value;
	const isKnockout = match.stage !== 'group';
	const issues = [];

	if (status === 'completed') {
	  if (homeScore === null || awayScore === null) {
		issues.push('Completed matches need both scores filled in.');
	  }

	  if (homeScore !== null && awayScore !== null) {
		const inferredWinner = inferWinnerFromScores(homeScore, awayScore);
		const isLevel = homeScore === awayScore;

		if (!isKnockout) {
		  if (winner && winner !== inferredWinner) {
			issues.push('The selected winner does not match the scores.');
		  }
		} else if (!isLevel) {
		  if (homePenalties !== null || awayPenalties !== null) {
			issues.push('Penalty shootout scores only apply when full-time scores are level — clear them if this match was not decided on penalties.');
		  }
		  if (winner && winner !== inferredWinner) {
			issues.push('The selected winner does not match the scores.');
		  }
		} else {
		  // Knockout match level after full time: penalties decide the winner.
		  if (homePenalties === null || awayPenalties === null) {
			issues.push('Knockout matches level after full time need penalty shootout scores.');
		  } else if (homePenalties === awayPenalties) {
			issues.push('Penalty shootouts cannot end in a draw.');
		  } else {
			const penaltyWinner = homePenalties > awayPenalties ? 'home' : 'away';
			if (winner && winner !== penaltyWinner) {
			  issues.push('The selected winner does not match the penalty shootout result.');
			}
		  }
		}
	  }
	} else if (status === 'in_progress') {
	  if (winner) {
		issues.push('In-progress matches should not have a winner yet.');
	  }
	} else if (homeScore !== null || awayScore !== null || winner) {
	  issues.push('Scheduled matches will be saved with scores cleared and winner unset.');
	}

	elements.matchNotes.value = issues.length ? issues.join('\n') : 'No validation issues detected.';
  }

  function selectMatch(matchId) {
	state.selectedMatchId = matchId;
	const match = state.draftData.matches.find(item => item.id === matchId);
	if (!match) {
	  setStatus(`Match ${matchId} not found.`, 'error');
	  return;
	}

	setEditorVisibility(true);
	elements.matchLabel.value = `${match.home.team} vs ${match.away.team}`;
	elements.matchId.value = match.id;
	elements.matchStage.value = prettyStage(match.stage);
	elements.matchDate.value = formatDateTime(match.date);
	elements.matchVenue.value = match.venue || '—';
	elements.homeScore.value = match.score?.home ?? '';
	elements.awayScore.value = match.score?.away ?? '';
	elements.homePenalty.value = match.penalties?.home ?? '';
	elements.awayPenalty.value = match.penalties?.away ?? '';
	elements.statusSelect.value = match.status || 'scheduled';
	renderWinnerOptions(match);
	elements.winnerSelect.value = match.winner ?? '';
	updateValidationPreview(match);
	hideNotice();
	renderMatchList();
	setStatus(`Editing ${match.id}.`);
  }

  function buildUpdatedMatch(match) {
	return buildUpdatedMatchFromInputs(match, {
	  status: elements.statusSelect.value,
	  homeScore: elements.homeScore.value,
	  awayScore: elements.awayScore.value,
	  homePenalties: elements.homePenalty.value,
	  awayPenalties: elements.awayPenalty.value,
	  winner: elements.winnerSelect.value || null,
	});
  }

  function applyEditorChanges() {
	const matchIndex = state.draftData.matches.findIndex(item => item.id === state.selectedMatchId);
	if (matchIndex < 0) {
	  throw new Error('Select a match first.');
	}

	const match = state.draftData.matches[matchIndex];
	const updatedMatch = buildUpdatedMatch(match);
	state.draftData.matches[matchIndex] = updatedMatch;

	localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draftData));
	renderMatchList();
	selectMatch(updatedMatch.id);
	setStatus(`${updatedMatch.id} saved to draft.`, 'success');
	showNotice('Draft updated locally. Download the JSON when you are ready to commit it.', 'success');
  }

  function downloadDraft() {
	const resultsData = extractResultsData(state.draftData?.matches || []);
	const json = `${JSON.stringify(resultsData, null, 2)}\n`;
	const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = 'results.json';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
	setStatus('Downloaded updated results.json.', 'success');
  }

  async function copyDraft() {
	const resultsData = extractResultsData(state.draftData?.matches || []);
	const json = `${JSON.stringify(resultsData, null, 2)}\n`;
	await navigator.clipboard.writeText(json);
	setStatus('results.json copied to clipboard.', 'success');
  }

  function loadDraft(data, sourceLabel) {
	state.sourceData = clone(data);
	state.draftData = clone(data);
	state.selectedMatchId = state.draftData.matches[0]?.id || null;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draftData));

	renderMatchList();
	if (state.selectedMatchId) {
	  selectMatch(state.selectedMatchId);
	} else {
	  setEditorVisibility(false);
	}

	setStatus(`Loaded ${sourceLabel}.`, 'success');
  }

  function loadStoredDraftIfPresent() {
	try {
	  const raw = localStorage.getItem(STORAGE_KEY);
	  if (!raw) {
		return false;
	  }

	  const parsed = JSON.parse(raw);
	  if (!parsed || !Array.isArray(parsed.matches)) {
		return false;
	  }

	  state.sourceData = clone(parsed);
	  state.draftData = clone(parsed);
	  state.selectedMatchId = state.draftData.matches[0]?.id || null;
	  return true;
	} catch (error) {
	  console.warn('Unable to restore stored draft:', error);
	  return false;
	}
  }

  async function loadRemoteTournament() {
	setStatus('Loading tournament.json and results.json…');
	try {
	  const [tournamentResponse, resultsResponse] = await Promise.all([
		fetch(`tournament.json?v=${Date.now()}`, { cache: 'no-store' }),
		fetch(`results.json?v=${Date.now()}`, { cache: 'no-store' }),
	  ]);

	  if (!tournamentResponse.ok) {
		throw new Error(`tournament.json HTTP ${tournamentResponse.status}`);
	  }
	  if (!resultsResponse.ok) {
		throw new Error(`results.json HTTP ${resultsResponse.status}`);
	  }

	  const tournamentData = await tournamentResponse.json();
	  const resultsData = await resultsResponse.json();
	  const mergedData = {
		...tournamentData,
		matches: mergeMatchesWithResults(tournamentData.matches, resultsData.matches),
	  };

	  loadDraft(mergedData, 'tournament.json + results.json');
	} catch (error) {
	  console.error(error);
	  setStatus(`Could not load remote files (${error.message}). Use the file picker to load a local copy.`, 'error');
	  showNotice('Remote loading failed. You can still edit by choosing a local results.json file.', 'error');
	}
  }

  function resetDraft() {
	if (!state.sourceData) {
	  return;
	}

	state.draftData = clone(state.sourceData);
	state.selectedMatchId = state.draftData.matches[0]?.id || null;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draftData));
	renderMatchList();
	if (state.selectedMatchId) {
	  selectMatch(state.selectedMatchId);
	}
	setStatus('Draft reset to the loaded source data.', 'success');
	showNotice('Draft reset.', 'success');
  }

  async function handleFileLoad(file) {
	if (!file) {
	  return;
	}

	const text = await file.text();
	const parsed = JSON.parse(text);

	if (!parsed || !Array.isArray(parsed.matches)) {
	  throw new Error('The selected file is not a valid JSON file with a matches array.');
	}

	const hasMatchMetadata = parsed.matches.some(match => match.home && match.away && match.stage && match.date);
	if (hasMatchMetadata) {
	  loadDraft(parsed, file.name);
	  showNotice(`Loaded ${file.name} from your device.`, 'success');
	  return;
	}

	if (!state.sourceData || !Array.isArray(state.sourceData.matches)) {
	  throw new Error('Load tournament.json first, then you can apply a local results.json file.');
	}

	const merged = {
	  ...state.sourceData,
	  matches: mergeMatchesWithResults(state.sourceData.matches, parsed.matches),
	};

	loadDraft(merged, file.name);
	showNotice(`Loaded ${file.name} from your device.`, 'success');
  }

  function bindEvents() {
	elements.searchInput.addEventListener('input', renderMatchList);
	elements.stageFilter.addEventListener('change', renderMatchList);
	elements.statusFilter.addEventListener('change', renderMatchList);

	elements.fileInput.addEventListener('change', async () => {
	  const [file] = elements.fileInput.files || [];
	  if (!file) {
		return;
	  }

	  try {
		await handleFileLoad(file);
		setStatus(`Loaded ${file.name} from device storage.`, 'success');
	  } catch (error) {
		console.error(error);
		setStatus(error.message, 'error');
		showNotice(error.message, 'error');
	  } finally {
		elements.fileInput.value = '';
	  }
	});

	elements.reloadButton.addEventListener('click', () => loadRemoteTournament());
	elements.resetButton.addEventListener('click', () => resetDraft());
	elements.downloadButton.addEventListener('click', () => downloadDraft());
	elements.copyButton.addEventListener('click', async () => {
	  try {
		await copyDraft();
	  } catch (error) {
		console.error(error);
		setStatus('Clipboard access failed. Download the file instead.', 'error');
		showNotice('Clipboard access failed on this device. Use Download instead.', 'error');
	  }
	});

	elements.editorForm.addEventListener('submit', event => {
	  event.preventDefault();
	  try {
		applyEditorChanges();
	  } catch (error) {
		console.error(error);
		setStatus(error.message, 'error');
		showNotice(error.message, 'error');
	  }
	});

	[elements.homeScore, elements.awayScore, elements.homePenalty, elements.awayPenalty, elements.statusSelect, elements.winnerSelect].forEach(element => {
	  element.addEventListener('input', () => updateValidationPreview());
	  element.addEventListener('change', () => updateValidationPreview());
	});
  }

  function initElements() {
	elements.statusBar = $('statusBar');
	elements.summaryGrid = $('summaryGrid');
	elements.fileInput = $('fileInput');
	elements.searchInput = $('searchInput');
	elements.stageFilter = $('stageFilter');
	elements.statusFilter = $('statusFilter');
	elements.reloadButton = $('reloadButton');
	elements.resetButton = $('resetButton');
	elements.matchCount = $('matchCount');
	elements.matchList = $('matchList');
	elements.editorEmpty = $('editorEmpty');
	elements.editorForm = $('editorForm');
	elements.matchLabel = $('matchLabel');
	elements.matchId = $('matchId');
	elements.matchStage = $('matchStage');
	elements.matchDate = $('matchDate');
	elements.matchVenue = $('matchVenue');
	elements.homeScore = $('homeScore');
	elements.awayScore = $('awayScore');
	elements.homePenalty = $('homePenalty');
	elements.awayPenalty = $('awayPenalty');
	elements.homePenaltyField = $('homePenaltyField');
	elements.awayPenaltyField = $('awayPenaltyField');
	elements.statusSelect = $('statusSelect');
	elements.winnerSelect = $('winnerSelect');
	elements.matchNotes = $('matchNotes');
	elements.downloadButton = $('downloadButton');
	elements.copyButton = $('copyButton');
	elements.editorNotice = $('editorNotice');
  }

  async function bootstrap() {
	initElements();
	bindEvents();

	setEditorVisibility(false);

	const restored = loadStoredDraftIfPresent();
	if (restored) {
	  renderMatchList();
	  if (state.selectedMatchId) {
		selectMatch(state.selectedMatchId);
	  }
	  setStatus('Restored your last draft from this device. Reload to start from the live JSON again.', 'success');
	  showNotice('Restored a draft from local storage. You can keep editing or reload from tournament.json + results.json.', 'success');
	  return;
	}

	await loadRemoteTournament();
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
