const { Octokit } = require("@octokit/rest");

const { utils, align_username, align, align_to } = require("./utils")

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


function dateDiffInDays(date) {

    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.now();
    Date.now()
    const b = new Date(date)
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc1 - utc2) / _MS_PER_DAY);
}

function ageBreakdown(date) {
    const _MS_PER_HOUR = 1000 * 60 * 60;
    const _MS_PER_DAY = _MS_PER_HOUR * 24;
    const _MS_PER_YEAR = _MS_PER_DAY * 365;

    let diffMs = Date.now() - new Date(date).getTime();

    const years = Math.floor(diffMs / _MS_PER_YEAR);
    diffMs -= years * _MS_PER_YEAR;
    const days = Math.floor(diffMs / _MS_PER_DAY);
    diffMs -= days * _MS_PER_DAY;
    const hours = Math.floor(diffMs / _MS_PER_HOUR);

    return `${years}y ${days}d ${hours}h`;
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

    async getIssueAndPr(type) {
        let res = await octokit.search.issuesAndPullRequests({
            q: `type:${type} author:${this.userName}`
        })

        return res.data.total_count
    }

    async fetchContent() {
        this.userContent = await octokit.request("GET /users/{username}", {
            username: this.userName,
        });
        this.repoContent = await octokit.paginate("GET /users/{owner}/repos", {
            owner: this.userName,
        });
        this.name = this.userContent.data.name;
        this.repo = align(this.userContent.data.public_repos);
        this.gists = align(this.userContent.data.public_gists);
        this.followers = align(this.userContent.data.followers);
        this.createdAt = dateDiffInDays(this.userContent.data.created_at);
        this.starsCount = 0;
        this.forkCount = 0;
        this.repoContent.forEach(repo => {
            this.starsCount += repo.stargazers_count
            this.forkCount += repo.forks;
        });
        this.commitsCount = await this.getCommits()
        this.issueCount = await this.getIssueAndPr('issue')
        this.prCount = await this.getIssueAndPr('pr')
        this.stars = align(this.starsCount);
        this.forks = align(this.forkCount);
        this.commits = align(this.commitsCount);
        this.issues = align(this.issueCount);
        this.pr = align(this.prCount);
        this.uptime = this.createdAt;
        this.uptimeAligned = align_to(ageBreakdown(this.userContent.data.created_at), 16);
        this.username = align_username(this.userName);
    }
}


module.exports = { GithubUser }
