# FIFA World Cup 2026 - Trophy Challenge

## Description

This web app will serve to track predictions by 8 players who have drawn an
equal amount of teams (6) from the starting pool of the FIFA World Cup 2026, which is 48 teams.
There are 12 pools, with 4 teams in each pool.

A draw will take place and I will manually update a JSON file with the names
of each player and the teams they have drawn.

The web app will also be contain all the matches, including the group stages
and the knockout stages, with the teams that will be playing in each match.

After each match result, I will update the score. Matches which have been played
but don't have a score recorded yet will be marked as "TBD" (To Be Determined).

There will be a feature that each player can click their name and see the
results of each match their teams have played. They can also see which
of their teams are still in the running for the final and which of their teams
have been knocked out.

The site is mobile friendly and allows for easy navigation.

There will be an overall leaderboard which will serve as the basis for 1st, 2nd
and 3rd place prizes.

## Screens

### General Design

The design will be clean and simple, with a focus on usability and ease of navigation.
The color scheme will be based on the colors of the FIFA World Cup, with a lot of green and blue,
and some accents of yellow and red.
Where ever a country is mentioned, the flag of that country will be shown next to the name,
for easy visual recognition.
Players in the game will have their own avatar which will be uploaded by me and shown next to
their name, for easy visual recognition.

### 1. Landing Page:

Shows the next upcoming match, including the players who picked those teams, essentially it's
for example "Next Match: (Date, Time) Mexico vs South Africa (Player 1 vs Player 2)".
It has a button at the bottom, that when you click it, slides down to reveal the full
schedule of upcoming matches, using the same format as for the next match, grouped by date.

The top 3 players in the leaderboard are also shown on the landing page, with their names and the
teams they have drawn. It also a button at the bottom, that when you click it, slides
down to reveal the full leaderboard with all 8 players.

### 2. Player Page:

When you click on a player's name, it takes you to their player page, which shows all the
teams they have drawn, and the results of each match those teams have played. It also
shows which of their teams are still in the running for the final and which of their
teams have been knocked out.

### 3. Match Page:

When you click on a match, it takes you to the match page, which shows the teams that are
playing, the date and time of the match, and the score if the match has been played.
If the match has not been played yet, it will show "TBD" (To Be Determined) instead of the score.
If the team for that match is not determined because it depends on the result of a previous
match, it will show "TBD" for the team as well.

### 4. Team Page:

When you click on a team, it takes you to the team page, which shows the players who have drawn
that team, and the results of each match that team has played and their upcoming matches.
It also shows which stage of the tournament the team is currently in, and if they have
been knocked out, it shows the stage at which they were knocked out.

### 5. Leaderboard Page:

When you click on the leaderboard button, it takes you to the leaderboard page, which shows
all 8 players and their teams, ranked by how far their top team has gone in the tournament.
Scoring is determined according to the rules laid out in the
"Scoring & Leaderboard Ranking Mechanism" section below.

## Scoring & Leaderboard Ranking Mechanism

During the group stage, players will earn points based on the performance of their
teams in the matches. The points will be awarded as follows:
- Win: 3 points
- Draw: 1 point
- Loss: 0 points
So points are accumulated and updated after each match.

**Highest Points Award**: The player with the most accumulated points at the end of the
group stage will receive the "Highest Points" award, recognizing their superior prediction
and team selection during the group stage.

After the group stage, scoring based on the points will stop and the ranking is based solely on
how many teams each player has left in the tournament until the final where players are ranked
according to how far their top team has gone in the tournament. If there is a tie,
the tiebreaker is the total number of points accumulated during the group stage.

## Stages of the Tournament

The tournament will be divided into the following stages:
1. Group Stage: 48 teams divided into 12 groups of 4 teams each.
2. Round of 32: The top 2 teams from each group, plus the 8 best third-placed teams, advance to the Round of 32.
3. Round of 16: The winners of the Round of 32 matches advance to the Round of 16.
4. Quarterfinals: The winners of the Round of 16 matches advance to the Quarterfinals.
5. Semifinals: The winners of the Quarterfinals matches advance to the Semifinals.
6. Third Place Playoff: The losers of the Semifinals matches play against each other for third place.
7. Final: The winners of the Semifinals matches play against each other in the Final to determine the champion.


## Technologies Used

The site will be built using HTML, CSS, and JavaScript. The data will be stored
in a JSON file that will be manually updated with the draw results and match
scores. There is no database or backend server.

## The FIFA World Cup 2026 Groups and Teams

Group A
- Mexico
- South Africa
- South Korea
- Czechia

Group B
- Canada
- Bosnia and Herzegovina
- Qatar
- Switzerland

Group C
- Brazil
- Morocco
- Haiti
- Scotland

Group D
- USA
- Paraguay
- Australia
- Turkey

Group E
- Germany
- Curaçao
- Ivory Coast
- Ecuador

Group F
- Netherlands
- Japan
- Sweden
- Tunisia

Group G
- Belgium
- Egypt
- Iran
- New Zealand

Group H
- Spain
- Cape Verde
- Saudi Arabia
- Uruguay

Group I
- France
- Senegal
- Iraq
- Norway

Group J
- Argentina
- Algeria
- Austria
- Jordan

Group K
- Portugal
- DR Congo
- Uzbekistan
- Colombia

Group L
- England
- Croatia
- Ghana
- Panama
