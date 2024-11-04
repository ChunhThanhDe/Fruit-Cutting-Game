const fs = require('fs');

module.exports = async ({ github, context }) => {
    const query = `query($owner:String!, $name:String!, $issue_number:Int!) {
      repository(owner:$owner, name:$name){
        issue(number:$issue_number) {
          title
          bodyText
          author {
            avatarUrl(size: 24)
            login
            url
          }
          updatedAt
        }
      }
    }`;

    const variables = {
      owner: context.repo.owner,
      name: context.repo.repo,
      issue_number: context.issue.number,
    };

    const result = await github.graphql(query, variables);
    console.log(JSON.stringify(result, null, 2));

    const issue = result.repository.issue;

    const nameMatch = /👤 Name:\s*(.*?)\n-/.exec(issue.bodyText);
    const githubLinkMatch = /🔗 GitHub Profile Link:\s*(.*?)\n-/.exec(issue.bodyText);
    const messageMatch = /💬 Message:\s*(.*?)\n-/.exec(issue.bodyText);
    const scoreMatch = /Score:\s*(\d+)/.exec(issue.title);
    const dateMatch = /Game Result Submission:\s*(.*?) - Score:/.exec(issue.title);
    const modeMatch = /Mode:\s*(\d+)/.exec(issue.title);
    const winMatch = /Win:\s*(\d+)/.exec(issue.title);


    // Extract values or fallback to author details if null
    const name = nameMatch ? nameMatch[1].trim() : issue.author.login; // Use author's GitHub login if name not found
    const githubLink = githubLinkMatch ? githubLinkMatch[1].trim() : issue.author.url; // Use author's URL if not found
    const message = messageMatch ? messageMatch[1].trim() : ''; // Default message if not found
    const score = scoreMatch ? parseInt(scoreMatch[1].trim()) : null; // Extract score
    const date = dateMatch ? dateMatch[1].trim() : null; // Extract date
    const mode = modeMatch ? parseInt(modeMatch[1].trim()) : null; // Extract mode
    const win = winMatch ? parseInt(winMatch[1].trim()) : null; // Extract win status

    // Check if any of the extracted values are null, if so, stop processing
    if (score === null || date === null || mode === null || win === null) {
        console.log('One or more required fields are missing. Stopping further processing.');
        return; // Exit or stop further execution as needed
    }

    // Map mode values to difficulty levels
    const modeMapping = {
      0: 'Easy',
      1: 'Medium',
      2: 'Hard'
    };

    // Get the corresponding difficulty level or 'N/A' if not found
    const difficulty = modeMapping[mode] || 'N/A';

    // Determine game outcome based on win value
    const gameOutcome = win === 1 ? 'Win' : (win === 0 ? 'Game Over' : 'N/A');

    const newLeaderboardItem = `| ${score} | ${difficulty} | [<img src="${issue.author.avatarUrl}" alt="${issue.author.login}" width="24" /> ${name}](${githubLink}) | ${message} | ${date} |\n`;

    const newEntry = `| ${date} | [<img src="${issue.author.avatarUrl}" alt="${issue.author.login}" width="24" /> ${name}](${githubLink}) | ${message} | ${difficulty} | ${score} | ${gameOutcome} |`;

    const readmePath = 'README.md';
    let readme = fs.readFileSync(readmePath, 'utf8');

    // Update Recent Plays
    const recentPlaysSection = /<!-- Recent Plays -->[\s\S]*?<!-- \/Recent Plays -->/.exec(readme);
    if (recentPlaysSection) {
        let recentPlaysContent = recentPlaysSection[0];


        let recentPlaysRows = recentPlaysContent
            .split('\n')
            .filter(row => row.startsWith('|') && !row.includes('Date | Player | Message | Score ') && !row.includes('|-------|--------|---------|------|'));


        recentPlaysRows.unshift(newEntry);

        console.log("Current length of recentPlaysRows after sorting:", recentPlaysRows.length);
        if (recentPlaysRows.length > 20) {
            recentPlaysRows = recentPlaysRows.slice(0, 20);
        }


        const updatedRecentPlays = `<!-- Recent Plays -->\n| Date | Player | Message | Score |\n|-------|--------|---------|------|\n${recentPlaysRows.join('\n')}\n<!-- /Recent Plays -->`;
        readme = readme.replace(recentPlaysSection[0], updatedRecentPlays);
    }

    // Update Leaderboard
    const leaderboardSection = /<!-- Leaderboard -->[\s\S]*?<!-- \/Leaderboard -->/.exec(readme);
    if (leaderboardSection) {
        let leaderboardContent = leaderboardSection[0];
        leaderboardContent = leaderboardContent.replace(/<!-- \/Leaderboard -->/, `${newLeaderboardItem}<!-- \/Leaderboard -->`);

        let leaderboardRows = leaderboardContent
            .split('\n')
            .filter(row => row.startsWith('|') && !row.includes('Score | Player | Message | Date') && !row.includes('|-------|--------|---------|------|'));

        leaderboardRows.sort((a, b) => {
            const scoreA = a.match(/^\| (\d+) \|/);
            const scoreB = b.match(/^\| (\d+) \|/);
            const dateA = a.match(/\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/)[4].trim();
            const dateB = b.match(/\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/)[4].trim();


            // So sánh theo điểm trước
            if (scoreB && scoreA) {
                const scoreDiff = parseInt(scoreB[1]) - parseInt(scoreA[1]);
                if (scoreDiff !== 0) {
                    return scoreDiff;
                }
            }

            return dateB.localeCompare(dateA);
        });

        console.log("Current length of leaderboardRows after sorting:", leaderboardRows.length);

        if (leaderboardRows.length > 20) {
            leaderboardRows = leaderboardRows.slice(0, 20); // Giữ lại 20 phần tử đầu tiên
        }

        const updatedLeaderboard = `<!-- Leaderboard -->\n| Score | Player | Message | Date |\n|-------|--------|---------|------|\n${leaderboardRows.join('\n')}\n<!-- /Leaderboard -->`;
        readme = readme.replace(leaderboardSection[0], updatedLeaderboard);
    }

    fs.writeFileSync(readmePath, readme, 'utf8');
    console.log('README.md updated successfully.');
};
