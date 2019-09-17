import logger from './common/logger'
import fs from 'fs-extra'
import {
  join
} from 'path'
import request from 'request-promise'
import {
  app
} from 'electron'

const userDataPath = app.getPath('userData')

function configPath (ipfsd) {
  return join(ipfsd.repoPath, 'config')
}

function readConfigFile (ipfsd) {
  return fs.readJsonSync(configPath(ipfsd))
}

function writeConfigFile (ipfsd, config) {
  fs.writeJsonSync(configPath(ipfsd), config, {
    spaces: 2
  })
}

var boostrapList = []
async function requestData (n = 0) {
  const fromData = {
    Cursor: n
  }
  let res = await request.post({
    url: 'https://www.ipse.io/v2/peerids',
    form: JSON.stringify(fromData)
  })
  res = typeof res === 'string' ? JSON.parse(res) : res
  if (res && (res.Status === 201)) {
    logger.info(`[ipse] has get peers data Cursor: ${res['Cursor']}`)
    boostrapList = boostrapList.concat(res['Res'])
    if (res['Cursor'] !== 0) {
      await requestData(res['Cursor'])
    }
  } else {
    logger.error(`[ipse] welcome to 'https://github.com/IPSE-TEAM'`)
    logger.error(`[ipse] has error to request peerid data: ${res}`)
  }
}


// add peerid list to bootstrap
export default async function addPeerIdsToConfig (ipfsd) {
  logger.info(`[ipse] welcome to 'https://github.com/IPSE-TEAM'`)
  let config = null
  try {
    config = readConfigFile(ipfsd)
  } catch (err) {
    logger.error(`[daemon] checkCorsConfig: error reading config file: ${err.message || err}`)
    return
  }
  if (!config) {
    logger.error(`[daemon] checkCorsConfig: not find config file`)
    return
  }
  if (config.API && config.API.HTTPHeaders) {
    config.API.HTTPHeaders['Access-Control-Allow-Methods'] = ['PUT', 'POST', 'GET']
    config.API.HTTPHeaders['Access-Control-Allow-Origin'] = config.API.HTTPHeaders['Access-Control-Allow-Origin'] || []
    const allowedOrigins = config.API.HTTPHeaders['Access-Control-Allow-Origin']
    const ipseHostList = ['https://ipse.io', 'https://www.ipse.io']
    ipseHostList.forEach(ipseHost => {
      if (Array.isArray(allowedOrigins) && !allowedOrigins.includes(ipseHost)) {
        config.API.HTTPHeaders['Access-Control-Allow-Origin'].push(ipseHost)
      }
    })
  }
  config.Addresses.Gateway = config.Addresses.Gateway.replace('127.0.0.1', '0.0.0.0')
  if (!config.Bootstrap) {
    logger.error(`[ipse] connot get bootstrap of config`)
  }
  var bootstrap = config.Bootstrap
  if (!Array.isArray(bootstrap)) {
    bootstrap = []
  }
  logger.info(`[ipse] original bootstrap length: ${bootstrap.length}`)
  logger.info(`[ipse] requesting the latest peerid data...`)

  await requestData()
  let newPeerids = boostrapList
  if (newPeerids.length) {

    var oldSavedPeers = []
    if (fs.existsSync(join(userDataPath, 'ipseSavedPeers.ipse'))) {
      try {
        oldSavedPeers = fs.readJsonSync(join(userDataPath, 'ipseSavedPeers.ipse'), 'utf-8')
      } catch (error) {
        logger.error(`[ipse] ${error}`)
        oldSavedPeers = []
      }
    }
    // save new ipse Peersid
    try {
      fs.writeJSON(join(userDataPath, 'ipseSavedPeers.ipse'), newPeerids, 'utf-8')
    } catch (error) {
      logger.error(`[ipse] ${error}`)
    }
    // remove last request data
    bootstrap = bootstrap.filter(x => !oldSavedPeers.includes(x))
    // remove the same data
    config.Bootstrap = bootstrap.concat([...new Set(newPeerids)])
    config.Bootstrap = [...new Set(config.Bootstrap)]
    logger.info(`[ipse] new bootstrap length: ${config.Bootstrap.length}`)
    writeConfigFile(ipfsd, config)
    newPeerids = []

  } else {
    logger.error(`[ipse] welcome to 'https://github.com/IPSE-TEAM'`)
    logger.error(`[ipse] has error to request peerid data`)
  }

}
