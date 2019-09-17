import i18n from 'i18next'
import { clipboard, nativeImage, ipcMain } from 'electron'
import logger from './common/logger'
import { IS_MAC } from './common/consts'
import { notify, notifyError } from './common/notify'
import setupGlobalShortcut from './setup-global-shortcut'

const CONFIG_KEY = 'screenshotShortcut'

export const SHORTCUT = IS_MAC
  ? 'Command+Control+S'
  : 'CommandOrControl+Alt+S'

async function makeScreenshotDir (ipfs) {
  try {
    await ipfs.files.stat('/screenshots')
  } catch (_) {
    await ipfs.files.mkdir('/screenshots')
  }
}

async function onSucess (ipfs, launchWebUI, path, img) {
  const stats = await ipfs.files.stat(path)
  const url = `https://share.ipfs.io/#/${stats.hash}`
  clipboard.writeText(url)

  notify({
    title: i18n.t('screenshotTaken'),
    body: i18n.t('shareableLinkCopied'),
    icon: img.resize({
      width: 200,
      quality: 'good'
    })
  }, () => {
    launchWebUI(`/files${path}`)
  })
}

function onError (e) {
  logger.error(`[screenshot] ${e.toString()}`)

  notifyError({
    title: i18n.t('couldNotTakeScreenshot'),
    body: i18n.t('errorwhileTakingScreenshot')
  })
}

function handleScreenshot (ctx) {
  const { getIpfsd, launchWebUI } = ctx

  return async (_, output) => {
    const ipfsd = await getIpfsd()

    if (!ipfsd) {
      return
    }

    const ipfs = ipfsd.api

    if (!ipfs) {
      logger.info('[screenshot] daemon not running')
      return
    }

    try {
      await makeScreenshotDir(ipfs)
      const isDir = output.length > 1
      const rawDate = new Date()
      const date = `${rawDate.getFullYear()}-${rawDate.getMonth()}-${rawDate.getDate()}`
      const time = `${rawDate.getHours()}.${rawDate.getMinutes()}.${rawDate.getMilliseconds()}`
      let baseName = `/screenshots/${date} ${time}`

      if (isDir) {
        baseName += '/'
        await ipfs.files.mkdir(baseName)
      } else {
        baseName += '.png'
      }

      logger.info(`[screenshot] started: writing screenshots to ${baseName}`, { withAnalytics: 'SCREENSHOT_TAKEN' })
      let lastImage = null

      for (const { name, image } of output) {
        const img = nativeImage.createFromDataURL(image)
        const path = isDir ? `${baseName}${name}.png` : baseName
        await ipfs.files.write(path, img.toPNG(), { create: true })
        lastImage = img
      }

      logger.info(`[screenshot] completed: writing screenshots to ${baseName}`)
      onSucess(ipfs, launchWebUI, baseName, lastImage)
    } catch (e) {
      onError(e)
    }
  }
}

export function takeScreenshot (ctx) {
  const { webui } = ctx
  logger.info('[screenshot] taking screenshot')
  webui.webContents.send('screenshot')
}

export default function (ctx) {
  setupGlobalShortcut(ctx, {
    settingsOption: CONFIG_KEY,
    accelerator: SHORTCUT,
    action: () => {
      takeScreenshot(ctx)
    }
  })

  ipcMain.on('screenshot', handleScreenshot(ctx))
}
