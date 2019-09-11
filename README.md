# IPSE Desktop

> A desktop client for [IPSE](https://ipse.io) based on [ipfs-desktop](https://github.com/ipfs-shipyard/ipfs-desktop).
>
> We added our IPSE node data to IPFS bootstrap before the client started.
> We don't want to change the UI ,so we kept the UI and logo of the original project. 
>
> You don't need the command line to run an IPFS node. Just install IPSE Desktop and have all the power of IPFS in your hands. Powered by [Web UI](https://github.com/ipfs-shipyard/ipfs-webui).

**Download the latest release**

- Mac - [ipse-desktop-0.9.1.dmg](https://github.com/IPSE-TEAM/ipse-desktop/releases/download/v0.9.1/ipse-desktop-0.9.1.dmg)
- Windows - [ipse-desktop-setup-0.9.1.exe](https://github.com/IPSE-TEAM/ipse-desktop/releases/download/v0.9.1/ipse-desktop-setup-0.9.1.exe) 
- Linux - [ipse-desktop-0.9.1-linux-x86_64.AppImage](https://github.com/IPSE-TEAM/ipse-desktop/releases/download/v0.9.1/ipse-desktop-0.9.1-linux-x86_64.AppImage)
### Install from Source

To install it from source you need [Node.js](https://nodejs.org/en/) `>=10.4.0` and
need [npm](npmjs.org) `>=6.1.0` installed. This uses [`node-gyp`](https://github.com/nodejs/node-gyp) so **you must take a look** at their [platform specific dependencies](https://github.com/nodejs/node-gyp#installation).

Then the follow the steps below to clone the source code, install the dependencies and run it the app:

```bash
git clone https://github.com/IPSE-TEAM/ipse-desktop.git
cd ipse-desktop
npm install
npm start
```

The IPSE Desktop app will launch and should appear in your OS menu bar.


