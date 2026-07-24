const setupInputs = {
  totalTeams: document.getElementById("totalTeams"),
  totalPlayers: document.getElementById("totalPlayers"),
  entryFee: document.getElementById("entryFee"),
  totalPot: document.getElementById("totalPot"),
  entryFeeEcho: document.getElementById("entryFeeEcho"),
  allocationPerPlayer: document.getElementById("allocationPerPlayer"),
  allocationDifference: document.getElementById("allocationDifference")
};

const gamesTableBody = document.getElementById("gamesTableBody");
const teamTableHead = document.getElementById("teamTableHead");
const teamTableBody = document.getElementById("teamTableBody");
const scoreViewSelect = document.getElementById("scoreView");
const allocationStatus = document.getElementById("allocationStatus");
const teamStatus = document.getElementById("teamStatus");
const validationStatus = document.getElementById("validationStatus");
const potStatus = document.getElementById("potStatus");
const errorBox = document.getElementById("errorBox");
const gameResults = document.getElementById("gameResults");
const teamSummary = document.getElementById("teamSummary");
const cashSettlement = document.getElementById("cashSettlement");

const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");

const GAME_DEFS = [
  { key: "first_front", name: "1st Ball Front", winnerType: "Lowest Score", stat: "first_front", category: "first" },
  { key: "first_back", name: "1st Ball Back", winnerType: "Lowest Score", stat: "first_back", category: "first" },
  { key: "first_total", name: "1st Ball Total", winnerType: "Lowest Score", stat: "first_total", category: "first" },
  { key: "second_front", name: "2nd Ball Front", winnerType: "Lowest Score", stat: "second_front", category: "second" },
  { key: "second_back", name: "2nd Ball Back", winnerType: "Lowest Score", stat: "second_back", category: "second" },
  { key: "second_total", name: "2nd Ball Total", winnerType: "Lowest Score", stat: "second_total", category: "second" },
  { key: "third_front", name: "3rd Ball Front", winnerType: "Lowest Score", stat: "third_front", category: "third" },
  { key: "third_back", name: "3rd Ball Back", winnerType: "Lowest Score", stat: "third_back", category: "third" },
  { key: "third_total", name: "3rd Ball Total", winnerType: "Lowest Score", stat: "third_total", category: "third" },
  { key: "birdies_front", name: "Birdies Front", winnerType: "Highest Count", stat: "birdies_front", category: "birdie" },
  { key: "birdies_back", name: "Birdies Back", winnerType: "Highest Count", stat: "birdies_back", category: "birdie" },
  { key: "birdies_total", name: "Birdies Total", winnerType: "Highest Count", stat: "birdies_total", category: "birdie" }
];

const FAMILY_CONFIG = [
  { family: "first", label: "1st Ball" },
  { family: "second", label: "2nd Ball" },
  { family: "third", label: "3rd Ball" },
  { family: "birdies", label: "Birdies" }
];

const teamState = Array.from({ length: 8 }, (_, idx) => ({
  name: `#${idx + 1}`,
  first_front: "",
  first_back: "",
  second_front: "",
  second_back: "",
  third_front: "",
  third_back: "",
  birdies_front: "",
  birdies_back: ""
}));

function totalTeamsForRender() {
  const value = asNumber(setupInputs.totalTeams.value);
  if (!Number.isInteger(value)) {
    return 1;
  }
  return Math.max(1, Math.min(8, value));
}

function asNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function usd(value) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function gameIsActive(key) {
  const el = document.querySelector(`.game-active[data-game="${key}"]`);
  return Boolean(el && el.checked);
}

function familyTotal(team, family) {
  const front = asNumber(team[`${family}_front`]);
  const back = asNumber(team[`${family}_back`]);
  if (Number.isNaN(front) || Number.isNaN(back)) {
    return NaN;
  }
  return front + back;
}

function teamGameValue(team, stat) {
  if (stat.endsWith("_total")) {
    const family = stat.replace("_total", "");
    return familyTotal(team, family);
  }
  return asNumber(team[stat]);
}

function visibleScoreColumns() {
  const scoreView = scoreViewSelect ? scoreViewSelect.value : "all";
  const columns = [];
  FAMILY_CONFIG.forEach(({ family, label }) => {
    if (scoreView !== "all" && scoreView !== family) {
      return;
    }

    const frontActive = gameIsActive(`${family}_front`);
    const backActive = gameIsActive(`${family}_back`);
    const totalActive = gameIsActive(`${family}_total`);

    if (frontActive || totalActive) {
      columns.push({ key: `${family}_front`, label: `${label} Front`, kind: "input" });
    }
    if (backActive || totalActive) {
      columns.push({ key: `${family}_back`, label: `${label} Back`, kind: "input" });
    }
    if (totalActive) {
      columns.push({ key: `${family}_total`, label: `${label} Total`, kind: "total" });
    }
  });
  return columns;
}

function renderGameRows() {
  gamesTableBody.innerHTML = "";
  GAME_DEFS.forEach((game) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="center"><input class="game-active" data-game="${game.key}" type="checkbox" /></td>
      <td>${game.name}</td>
      <td><input class="alloc input-blue" data-game="${game.key}" type="number" min="0" step="0.01" /></td>
      <td><input class="game-pot input-gray" data-game-pot="${game.key}" type="number" readonly /></td>
    `;
    gamesTableBody.appendChild(row);
  });
}

function renderTeamTable() {
  const columns = visibleScoreColumns();
  const visibleTeams = totalTeamsForRender();

  teamTableHead.innerHTML = `
    <tr>
      <th>Team</th>
      ${columns.map((c) => `<th>${c.label}</th>`).join("")}
    </tr>
  `;

  teamTableBody.innerHTML = "";

  teamState.slice(0, visibleTeams).forEach((team, idx) => {
    const cells = columns
      .map((column) => {
        if (column.kind === "input") {
          const value = team[column.key] || "";
          return `<td><input class="score input-green" data-team-index="${idx}" data-stat="${column.key}" type="text" inputmode="text" pattern="-?[0-9]*" autocomplete="off" autocapitalize="off" spellcheck="false" value="${value}" /></td>`;
        }

        const family = column.key.replace("_total", "");
        const total = familyTotal(team, family);
        const value = Number.isNaN(total) ? "" : String(total);
        return `<td><input class="input-gray total-display" data-team-index="${idx}" data-family="${family}" type="text" value="${value}" readonly /></td>`;
      })
      .join("");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input class="team-name input-blue" data-team-index="${idx}" type="text" value="${escapeHtml(team.name)}" /></td>
      ${cells}
    `;
    teamTableBody.appendChild(row);
  });
}

function updateTotalDisplaysForTeam(teamIndex) {
  const cells = document.querySelectorAll(`.total-display[data-team-index="${teamIndex}"]`);
  cells.forEach((cell) => {
    const family = cell.dataset.family;
    const total = familyTotal(teamState[teamIndex], family);
    cell.value = Number.isNaN(total) ? "" : String(total);
  });
}

function activeGamesWithPot(totalPlayers) {
  return GAME_DEFS.map((game) => {
    const allocationEl = document.querySelector(`.alloc[data-game="${game.key}"]`);
    const allocation = asNumber(allocationEl.value || 0);
    return {
      ...game,
      active: gameIsActive(game.key),
      allocation,
      gamePot: Number.isNaN(allocation) ? NaN : round2(allocation * totalPlayers)
    };
  });
}

function updateSetupDerived() {
  const totalPlayers = asNumber(setupInputs.totalPlayers.value || 0);
  const entryFee = asNumber(setupInputs.entryFee.value || 0);

  const safePlayers = Number.isNaN(totalPlayers) ? 0 : totalPlayers;
  const safeEntry = Number.isNaN(entryFee) ? 0 : entryFee;

  const totalPot = round2(safePlayers * safeEntry);
  setupInputs.totalPot.value = totalPot.toFixed(2);
  setupInputs.entryFeeEcho.value = safeEntry.toFixed(2);

  const games = activeGamesWithPot(safePlayers);
  let allocationPerPlayer = 0;

  games.forEach((game) => {
    const gamePotInput = document.querySelector(`.game-pot[data-game-pot="${game.key}"]`);
    gamePotInput.value = Number.isNaN(game.gamePot) ? "" : game.gamePot.toFixed(2);
    if (game.active) {
      allocationPerPlayer += Number.isNaN(game.allocation) ? 0 : game.allocation;
    }
  });

  allocationPerPlayer = round2(allocationPerPlayer);
  setupInputs.allocationPerPlayer.value = allocationPerPlayer.toFixed(2);

  const diff = round2(safeEntry - allocationPerPlayer);
  setupInputs.allocationDifference.value = diff.toFixed(2);

  if (Math.abs(diff) < 0.005) {
    allocationStatus.textContent = "Allocation Correct";
    allocationStatus.className = "hint ok";
  } else {
    allocationStatus.textContent = "Allocation Error";
    allocationStatus.className = "hint error-text";
  }

  const activeGames = games.filter((g) => g.active);
  const paidOut = round2(activeGames.reduce((sum, g) => sum + g.gamePot, 0));
  const delta = round2(totalPot - paidOut);

  if (activeGames.length === 0) {
    potStatus.textContent = "No active games selected.";
  } else if (Math.abs(delta) < 0.005) {
    potStatus.textContent = `Pot check is balanced. ${usd(totalPot)} in and ${usd(paidOut)} allocated.`;
  } else if (delta > 0) {
    potStatus.textContent = `Unallocated money: ${usd(delta)}.`;
  } else {
    potStatus.textContent = `Over-allocated by ${usd(Math.abs(delta))}.`;
  }
}

function validateData() {
  const totalTeams = asNumber(setupInputs.totalTeams.value);
  const totalPlayers = asNumber(setupInputs.totalPlayers.value);
  const entryFee = asNumber(setupInputs.entryFee.value);

  if (!Number.isInteger(totalTeams) || totalTeams < 1 || totalTeams > 8) {
    return { ok: false, message: "Total Teams must be an integer between 1 and 8." };
  }
  if (!Number.isInteger(totalPlayers) || totalPlayers < 1) {
    return { ok: false, message: "Total Players must be a positive integer." };
  }
  if (Number.isNaN(entryFee) || entryFee < 0) {
    return { ok: false, message: "Entry Fee Per Player must be a non-negative number." };
  }

  const games = activeGamesWithPot(totalPlayers);
  const activeGames = games.filter((game) => game.active);

  if (activeGames.length === 0) {
    return { ok: false, message: "At least one game must be active." };
  }

  for (let i = 0; i < activeGames.length; i += 1) {
    const game = activeGames[i];
    if (Number.isNaN(game.allocation) || game.allocation < 0) {
      return { ok: false, message: `Invalid allocation for ${game.name}.` };
    }
  }

  const allocationPerPlayer = round2(activeGames.reduce((sum, game) => sum + game.allocation, 0));
  if (Math.abs(allocationPerPlayer - entryFee) >= 0.005) {
    return { ok: false, message: "Allocation error: active game allocations per player must equal entry fee." };
  }

  const teams = teamState.slice(0, totalTeams);
  const duplicateCheck = new Set();

  for (let i = 0; i < teams.length; i += 1) {
    const team = teams[i];
    const name = team.name.trim();
    if (!name) {
      return { ok: false, message: `Team ${i + 1} is missing a team name.` };
    }
    const lower = name.toLowerCase();
    if (duplicateCheck.has(lower)) {
      return { ok: false, message: "Duplicate team names found." };
    }
    duplicateCheck.add(lower);

  }

  teamStatus.textContent = `Active team rows: ${totalTeams} | Total players from setup: ${totalPlayers}`;

  if (totalPlayers < totalTeams) {
    return { ok: false, message: "Total Players cannot be less than Total Teams." };
  }

  let anyScoreFound = false;
  for (let i = 0; i < teams.length; i += 1) {
    const team = teams[i];
    for (let j = 0; j < activeGames.length; j += 1) {
      const game = activeGames[j];
      const value = teamGameValue(team, game.stat);
      if (!Number.isNaN(value)) {
        anyScoreFound = true;
      }
    }
  }

  if (!anyScoreFound) {
    return { ok: false, message: "No teams have scores for active games." };
  }

  for (let i = 0; i < teams.length; i += 1) {
    const team = teams[i];
    const name = team.name.trim();

    for (let j = 0; j < activeGames.length; j += 1) {
      const game = activeGames[j];
      const value = teamGameValue(team, game.stat);

      if (Number.isNaN(value)) {
        return { ok: false, message: `Blank winning score input: ${name} is missing ${game.name}.` };
      }

      // Best-ball scores can be entered as relative-to-par values (for example -6).
      if (game.stat.startsWith("birdies") && value < 0) {
        return { ok: false, message: `Invalid numeric input: ${name} has a negative value in ${game.name}.` };
      }
    }
  }

  return {
    ok: true,
    payload: {
      totalTeams,
      totalPlayers,
      entryFee,
      totalPot: round2(totalPlayers * entryFee),
      games,
      teams: teams.map((team) => ({ ...team, name: team.name.trim() }))
    }
  };
}

function pickWinners(teams, game) {
  const values = teams.map((team) => teamGameValue(team, game.stat));
  const targetValue = game.winnerType === "Highest Count" ? Math.max(...values) : Math.min(...values);
  const winners = teams.filter((team) => teamGameValue(team, game.stat) === targetValue);
  return {
    winners,
    targetValue,
    eachReceives: game.gamePot / winners.length
  };
}

function renderGameResults(gameRows) {
  if (gameRows.length === 0) {
    gameResults.textContent = "No active games.";
    return;
  }

  const rows = gameRows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.gameName)}</td>
        <td>${escapeHtml(row.winners)}</td>
        <td>${row.winningScore}</td>
        <td>${usd(row.gamePot)}</td>
        <td>${usd(row.eachReceives)}</td>
      </tr>
    `
    )
    .join("");

  gameResults.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Game</th>
            <th>Winner(s)</th>
            <th>Score</th>
            <th>Pot</th>
            <th>Receives</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderTeamSummary(teams, winningsByTeam) {
  const rows = teams
    .map((team) => {
      const win = winningsByTeam[team.name];
      return `
        <tr>
          <td>${escapeHtml(team.name)}</td>
          <td>${usd(win.first)}</td>
          <td>${usd(win.second)}</td>
          <td>${usd(win.third)}</td>
          <td>${usd(win.birdie)}</td>
          <td><strong>${usd(win.total)}</strong></td>
        </tr>
      `;
    })
    .join("");

  teamSummary.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>1st Ball Winnings</th>
            <th>2nd Ball Winnings</th>
            <th>3rd Ball Winnings</th>
            <th>Birdie Winnings</th>
            <th>Total Won</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderCashSettlement(teams, totalTeams, entryFee, totalPlayers, totalPot, activeGames, winningsByTeam) {
  const entryPaidPerTeam = totalTeams > 0 ? (totalPlayers * entryFee) / totalTeams : 0;
  const rows = teams
    .map((team) => {
      const entryPaid = entryPaidPerTeam;
      const won = winningsByTeam[team.name].total;
      const net = won - entryPaid;
      return `
        <tr>
          <td>${escapeHtml(team.name)}</td>
          <td>${usd(entryPaid)}</td>
          <td>${usd(won)}</td>
          <td class="${net >= 0 ? "ok" : "error-text"}">${usd(net)}</td>
        </tr>
      `;
    })
    .join("");

  const totalEntryMoney = round2(totalPlayers * entryFee);
  const totalPaidOut = round2(activeGames.reduce((sum, game) => sum + game.gamePot, 0));
  const difference = round2(totalEntryMoney - totalPaidOut);
  const checkClass = Math.abs(difference) < 0.005 ? "ok" : "error-text";

  cashSettlement.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Entry Paid</th>
            <th>Total Won</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="result-meta">Total Entry Money: ${usd(totalEntryMoney)} | Total Paid Out: ${usd(totalPaidOut)} | Difference: <span class="${checkClass}">${usd(difference)}</span></p>
    <p class="result-meta">Total Pot: ${usd(totalPot)}</p>
  `;
}

function calculateAndRender() {
  errorBox.textContent = "";
  validationStatus.textContent = "";

  const validation = validateData();
  if (!validation.ok) {
    errorBox.textContent = validation.message;
    return;
  }

  const { totalTeams, totalPlayers, entryFee, totalPot, games, teams } = validation.payload;
  const activeGames = games.filter((game) => game.active);

  const winningsByTeam = {};
  teams.forEach((team) => {
    winningsByTeam[team.name] = { first: 0, second: 0, third: 0, birdie: 0, total: 0 };
  });

  const gameRows = [];
  activeGames.forEach((game) => {
    const outcome = pickWinners(teams, game);
    outcome.winners.forEach((team) => {
      winningsByTeam[team.name][game.category] += outcome.eachReceives;
      winningsByTeam[team.name].total += outcome.eachReceives;
    });

    gameRows.push({
      gameName: game.name,
      winners: outcome.winners.map((team) => team.name).join(", "),
      winningScore: outcome.targetValue,
      gamePot: game.gamePot,
      eachReceives: outcome.eachReceives
    });
  });

  renderGameResults(gameRows);
  renderTeamSummary(teams, winningsByTeam);
  renderCashSettlement(teams, totalTeams, entryFee, totalPlayers, totalPot, activeGames, winningsByTeam);

  validationStatus.className = "hint ok";
  validationStatus.textContent = "Calculation complete.";

  document.getElementById("gameResults").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetTeamState() {
  for (let i = 0; i < teamState.length; i += 1) {
    teamState[i] = {
      name: `#${i + 1}`,
      first_front: "",
      first_back: "",
      second_front: "",
      second_back: "",
      third_front: "",
      third_back: "",
      birdies_front: "",
      birdies_back: ""
    };
  }
}

function resetRound() {
  if (!window.confirm("Reset round? All scores and settings will be cleared.")) {
    return;
  }
  setupInputs.totalTeams.value = "";
  setupInputs.totalPlayers.value = "";
  setupInputs.entryFee.value = "";

  renderGameRows();
  resetTeamState();
  renderTeamTable();
  updateSetupDerived();

  gameResults.textContent = "No results yet.";
  teamSummary.textContent = "No results yet.";
  cashSettlement.textContent = "No results yet.";
  errorBox.textContent = "";
  validationStatus.textContent = "";
  teamStatus.textContent = "";
}

function highlightEmptySetupFields() {
  [setupInputs.totalTeams, setupInputs.totalPlayers, setupInputs.entryFee].forEach((el) => {
    if (el.value === "") {
      el.classList.add("input-missing");
    } else {
      el.classList.remove("input-missing");
    }
  });
}

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target.classList.contains("alloc") || target.id === "totalPlayers" || target.id === "entryFee") {
    updateSetupDerived();
  }

  if (target.id === "totalTeams") {
    renderTeamTable();
  }

  if (["totalTeams", "totalPlayers", "entryFee"].includes(target.id)) {
    highlightEmptySetupFields();
  }

  if (target.classList.contains("team-name")) {
    const idx = Number(target.dataset.teamIndex);
    teamState[idx].name = target.value;
  }

  if (target.classList.contains("score")) {
    const idx = Number(target.dataset.teamIndex);
    const stat = target.dataset.stat;
    teamState[idx][stat] = target.value;
    if (stat.endsWith("_front") || stat.endsWith("_back")) {
      updateTotalDisplaysForTeam(idx);
    }
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.classList.contains("game-active")) {
    renderTeamTable();
    updateSetupDerived();
  }

  if (target.id === "scoreView") {
    renderTeamTable();
  }
});

calculateBtn.addEventListener("click", calculateAndRender);
resetBtn.addEventListener("click", resetRound);

[setupInputs.totalTeams, setupInputs.totalPlayers, setupInputs.entryFee].forEach((el) => {
  el.addEventListener("focus", () => el.select());
});

gamesTableBody.addEventListener("focus", (event) => {
  if (event.target.classList.contains("alloc")) {
    event.target.select();
  }
}, true);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Service worker failure should not block use.
    });
  });
}

renderGameRows();
renderTeamTable();
updateSetupDerived();
highlightEmptySetupFields();
