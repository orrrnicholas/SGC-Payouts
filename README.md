# SGC Golf Payouts (PWA)

A mobile-first Progressive Web App that follows the same logic as your sheet workflow.

## Workflow

1. Enter Total Teams, Total Players, Entry Fee Per Player.
2. Select active games with checkboxes.
3. Enter Allocation Per Player for each active game.
4. Enter Team names and Team scores.
5. Calculate payouts, team summaries, and settlement.

## Team score table behavior:
- Only selected game columns are shown.
- If a Total game is selected, Front and Back columns for that game are shown so Total can be computed.
- Every Total value is automatic: Front + Back.

## Rules Implemented

- Up to 8 teams
- Team score entry (not player score calculations)
- Fixed game list:
  - 1st Ball Front, Back, Total
  - 2nd Ball Front, Back, Total
  - 3rd Ball Front, Back, Total
  - Birdies Front, Back, Total
- Winner type is locked by game:
  - Best-ball games: Lowest Score wins
  - Birdie games: Highest Count wins
- Game Pot = Allocation Per Player x Total Players
- Inactive games are ignored completely
- Ties are never broken and always split evenly

## Validation and Checks

- Allocation Per Player total must equal Entry Fee Per Player
- No active games check
- Blank winning score check for active games
- Duplicate team name check
- Invalid numeric input checks
- Total Players must be greater than or equal to Total Teams
- Cash settlement money check:
  - Total Entry Money
  - Total Paid Out
  - Difference

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Push this project to the main branch.
3. In GitHub, open Settings > Pages.
4. Under Build and deployment:
  - Source: Deploy from a branch
  - Branch: main
  - Folder: /(root)
5. Save and wait for the Pages URL.
6. Open the published URL once so the service worker installs.

## Share with iPhone Users

1. Send the GitHub Pages URL.
2. In Safari, open the URL.
3. Tap Share > Add to Home Screen.

## Publish Readiness Checklist

- Logo file present as logo.png in project root (optional but recommended)
- App loads over HTTPS on GitHub Pages
- At least one game can be activated and calculated
- Allocation status shows Allocation Correct with your standard setup
- Cash settlement Difference shows $0.00 in a full test scenario

## Mobile and PWA

- Optimized for iPhone and Android with large inputs and horizontal score-table scrolling
- Offline capable after first load via service worker

## Run Locally

```powershell
py -m http.server 5173
```

Open http://localhost:5173

## Install on iPhone

1. Open in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
