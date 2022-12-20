# Socket repo enabler

This is a small program to enable repos for the Socket security app based on a repo topic.

## Step 1

Install the [Socket security app](https://github.com/marketplace/socket-security) and selectively enable it to at least 1 repo.

## Step 2

A user with application administration access to the org should create a personal access token with the following scopes:

```
admin:org, repo
```

https://github.com/settings/tokens

## Step 3

Download the script and install dependencies. Node 16 required.

- git clone https://github.com/SocketDev/gh-app-installer
- cd gh-app-installer
- npm i

## Step 4

Run the script. It will request a personal access token the first time it is run. The token is stored in local user storage and can be deactivated or deleted when the process completes.

- `node index.js`

```console
node index.js
Org name?
SocketDev
What repo topic should we activate Socket on?
socket-app-install
Activating Socket for SocketDev on all repos with the socket-app-install topic
App is installed
Install Socket to SocketDev/Test-App
Install Socket to SocketDev/gh-app-installer
Installing to Test-App...
Installed to Test-App
Installing to gh-app-installer...
Installed to gh-app-installer
Installed app to every repo with socket-app-install topic
```

You can re-run the script and any new repos with the topic label will be added to the app install.
