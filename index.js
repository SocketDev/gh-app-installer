import ghauth from 'ghauth'
import { Octokit } from 'octokit'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'

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

const org = 'SocketDev'

// const appID = 156372 // Socket-security
const appID = 155833 // socket-security-dev

let hasAppInstalled = false

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
      break
    }
  }
}

if (!hasAppInstalled) {
  console.log('App is not installed')
  process.exit(1)
}

console.log('App is installed')

for await (const response of octokit.paginate.iterator(
  octokit.rest.repos.listForOrg,
  {
    org,
    per_page: 100
  }
)) {
  for (const repo of response.data) {
    console.dir(repo, { depth: 999, colors: true })
  }
}
