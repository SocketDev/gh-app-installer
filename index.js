import ghauth from 'ghauth'
import { Octokit } from 'octokit'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

Octokit.plugin(throttling)
Octokit.plugin(retry)

const authOptions = {
  configName: 'socket-app-installer',
  scopes: ['repo', 'admin:org'],
  noDeviceFlow: true
}

const authData = await ghauth(authOptions)

const octokit = new Octokit({
  auth: authData.token,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.log(
        `Request quota exhausted for request ${options.method} ${options.url}`
      )
      if (options.request.retryCount <= 20) {
        console.log(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onAbuseLimit: (retryAfter, options) => {
      console.log(`Abuse detected for request ${options.method} ${options.url}`)
    }
  }
})

const org = await rl.question('What org are we activating repost for the Socket app?\n')
const installTopic = await rl.question('What repo topic should we activate Socket on?\n')

rl.close()

console.log(`Activating Socket for ${org} on all repos with the ${installTopic} topic`)

const appID = 156372 // socket-security
// const appID = 155833 // socket-security-dev

let hasAppInstalled = false
let appInstall = null

for await (const response of octokit.paginate.iterator(
  octokit.rest.orgs.listAppInstallations,
  {
    org,
    per_page: 100
  }
)) {
  for (const app of response.data) {
    if (app.app_id === appID) {
      hasAppInstalled = true
      appInstall = app
      break
    }
  }
}

if (!hasAppInstalled) {
  console.error('App is not installed')
  process.exit(1)
}

if (appInstall.suspended_at !== null) {
  console.error('App install appears to be suspended')
  process.exit(1)
}

if (appInstall.repository_selection !== 'selected') {
  console.error('App is installed to all repos. Can\'t selectively enable repos')
  process.exit(1)
}

console.log('App is installed')

const reposToInstall = []

for await (const response of octokit.paginate.iterator(
  octokit.rest.repos.listForOrg,
  {
    org,
    per_page: 100
  }
)) {
  for (const repo of response.data) {
    if (repo?.topics.includes(installTopic)) {
      reposToInstall.push(repo)
      console.log(`Install Socket to ${repo.full_name}`)
    }
  }
}

for (const repo of reposToInstall) {
  console.log(`Installing to ${repo.name}...`)
  await octokit.rest.apps.addRepoToInstallationForAuthenticatedUser({
    installation_id: appInstall.id,
    repository_id: repo.id
  })
  console.log(`Installed to ${repo.name}`)
}

console.log(`Installed app to every repo with ${installTopic} topic`)

process.exit(0)
