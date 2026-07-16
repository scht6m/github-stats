const { Octokit } = require("@octokit/rest");

const { align_username, pad } = require("./utils")

const token = process.env.GHT

const octokit = new Octokit({
    auth: token,
    log: {
        debug: () => { },
        info: () => { },
        warn: console.warn,
        error: console.error,
    },
});

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;
const MS_PER_YEAR = MS_PER_DAY * 365;

// Widths the template reserves, in characters.
const VALUE_WIDTH = 6;
const UPTIME_WIDTH = 28;
const CHAR_WIDTH = 8;
const PROMPT_SUFFIX = ":~$ ".length;


function plural(count, unit) {
    return `${count} ${unit}${count === 1 ? "" : "s"}`
}

function formatUptime(date) {

    let elapsed = Date.now() - new Date(date).getTime()

    const years = Math.floor(elapsed / MS_PER_YEAR)
    elapsed -= years * MS_PER_YEAR
    const days = Math.floor(elapsed / MS_PER_DAY)
    elapsed -= days * MS_PER_DAY
    const hours = Math.floor(elapsed / MS_PER_HOUR)

    return `${plural(years, "year")}, ${plural(days, "day")}, ${plural(hours, "hour")}`
}

class GithubUser {
    constructor(username) {
        this.userName = username;
    }

    async getCommits() {
        let res = await octokit.search.commits({
            q: `author:${this.userName}`
        })
        return res.data.total_count
    }

    async getPullRequests() {
        let res = await octokit.search.issuesAndPullRequests({
            q: `type:pr author:${this.userName}`
        })
        return res.data.total_count
    }

    async fetchContent() {
        const user = await octokit.request("GET /users/{username}", {
            username: this.userName,
        });
        const repos = await octokit.paginate("GET /users/{owner}/repos", {
            owner: this.userName,
        });

        let starsCount = 0;
        let forkCount = 0;
        repos.forEach(repo => {
            starsCount += repo.stargazers_count
            forkCount += repo.forks;
        });

        this.username = align_username(this.userName);
        this.usernameWidth = this.username.length * CHAR_WIDTH;
        this.promptWidth = (this.username.length + PROMPT_SUFFIX) * CHAR_WIDTH;
        this.separator = "-".repeat(this.username.length);

        this.stars = pad(starsCount, VALUE_WIDTH);
        this.forks = pad(forkCount, VALUE_WIDTH);
        this.commits = pad(await this.getCommits(), VALUE_WIDTH);
        this.followers = pad(user.data.followers, VALUE_WIDTH);
        this.pr = pad(await this.getPullRequests(), VALUE_WIDTH);
        this.repo = pad(user.data.public_repos, VALUE_WIDTH);
        this.uptime = pad(formatUptime(user.data.created_at), UPTIME_WIDTH);
    }
}


module.exports = { GithubUser }
