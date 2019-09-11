import i18n from 'i18next'
import util from 'util'
import sudo from 'sudo-prompt'
import { dialog, app } from 'electron'
import childProcess from 'child_process'
import { recoverableErrorDialog } from './dialogs'
import logger from './common/logger'

const execFile = util.promisify(childProcess.execFile)

const env = {
  noSudo: {
    ELECTRON_RUN_AS_NODE: 1
  },
  sudo: 'env ELECTRON_RUN_AS_NODE=1'
}

const getResult = (err, stdout, stderr, scope, failSilently) => {
  if (stdout) {
    logger.info(`[${scope}] sudo: stdout: ${stdout.toString().trim()}`)
  }

  if (stderr) {
    logger.info(`[${scope}] sudo: stderr: ${stderr.toString().trim()}`)
  }

  if (!err) {
    return true
  }

  const str = err.toString()
  logger.error(`[${scope}] error: ${str}`)

  if (process.env.NODE_ENV !== 'test' && !failSilently) {
    if (str.includes('No polkit authentication agent found')) {
      dialog.showErrorBox(i18n.t('polkitDialog.title'), i18n.t('polkitDialog.message'))
    } else if (str.includes('User did not grant permission')) {
      dialog.showErrorBox(i18n.t('noPermissionDialog.title'), i18n.t('noPermissionDialog.message'))
    } else {
      recoverableErrorDialog(err)
    }
  }

  return false
}

export default async function ({ script, scope, failSilently, trySudo = true }) {
  const dataArg = `--data="${app.getPath('userData')}"`
  let err = null

  // First try executing with regular permissions.
  try {
    const { stdout } = await execFile(process.execPath, [script, dataArg], { env: env.noSudo })
    logger.info(`[${scope}] stdout: ${stdout.toString().trim()}`)
    return true
  } catch ({ stderr }) {
    const msg = stderr.toString().trim()
    err = new Error(msg)
    logger.info(`[${scope}] no-sudo: stderr: ${msg}`)
  }

  if (!trySudo) {
    if (!failSilently) {
      recoverableErrorDialog(err)
    }

    return false
  }

  // Otherwise, try to elevate the user.
  const command = `${env.sudo} "${process.execPath}" "${script}" ${dataArg}`
  return new Promise(resolve => {
    sudo.exec(command, { name: 'IPFS Desktop' }, (err, stdout, stderr) => {
      resolve(getResult(err, stdout, stderr, scope, failSilently))
    })
  })
}
