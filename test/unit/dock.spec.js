/* eslint-env mocha */

import sinon from 'sinon'
import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import mockElectron from './mocks/electron'

const proxyquire = require('proxyquire')
  .noCallThru()
  .noPreserveCache()

chai.use(dirtyChai)

describe('Dock', () => {
  it('show dock succeeds with dock (macOS)', () => {
    const electron = mockElectron({ withDock: true })
    const { show } = proxyquire('../../src/dock', { electron }).default
    show()
    expect(electron.app.dock.show.callCount).to.equal(1)
  })

  it('show dock succeeds without dock (other OSes)', () => {
    const electron = mockElectron()
    const { show } = proxyquire('../../src/dock', { electron }).default
    show()
  })

  it('hide dock succeeds with dock and no windows (macOS)', () => {
    const electron = mockElectron({ withDock: true })
    electron.BrowserWindow.getAllWindows.returns([])
    const { hide } = proxyquire('../../src/dock', { electron }).default
    hide()
    expect(electron.app.dock.hide.callCount).to.equal(1)
  })

  it('hide dock succeeds with dock and no visible windows (macOS)', () => {
    const electron = mockElectron({ withDock: true })
    const windows = [
      { isVisible: sinon.stub().returns(false) },
      { isVisible: sinon.stub().returns(false) }
    ]
    electron.BrowserWindow.getAllWindows.returns(windows)
    const { hide } = proxyquire('../../src/dock', { electron }).default
    hide()
    expect(windows[0].isVisible.callCount).to.equal(1)
    expect(windows[1].isVisible.callCount).to.equal(1)
    expect(electron.app.dock.hide.callCount).to.equal(1)
  })

  it('hide dock succeeds with dock and with visible windows (macOS)', () => {
    const electron = mockElectron({ withDock: true })
    const windows = [
      { isVisible: sinon.stub().returns(true) },
      { isVisible: sinon.stub().returns(false) }
    ]
    electron.BrowserWindow.getAllWindows.returns(windows)
    const { hide } = proxyquire('../../src/dock', { electron }).default
    hide()
    expect(windows[0].isVisible.callCount).to.equal(1)
    expect(windows[1].isVisible.callCount).to.equal(1)
    expect(electron.app.dock.hide.callCount).to.equal(0)
  })

  it('hide dock succeeds without dock (other OSes)', () => {
    const electron = mockElectron()
    const { hide } = proxyquire('../../src/dock', { electron }).default
    hide()
  })

  it('runs async function with dock (macOS)', async () => {
    const electron = mockElectron({ withDock: true })
    electron.BrowserWindow.getAllWindows.returns([])
    const { run } = proxyquire('../../src/dock', { electron }).default
    const fn = sinon.stub().resolves(5)
    const res = await run(fn)
    expect(res).to.equal(5)
    expect(electron.app.dock.show.callCount).to.equal(1)
    expect(electron.app.dock.hide.callCount).to.equal(1)
    expect(electron.app.dock.show.calledBefore(electron.app.dock.hide)).to.equal(true)
  })

  it('runs async function without dock (other OSes)', async () => {
    const electron = mockElectron()
    electron.BrowserWindow.getAllWindows.returns([])
    const { run } = proxyquire('../../src/dock', { electron }).default
    const fn = sinon.stub().resolves(5)
    const res = await run(fn)
    expect(res).to.equal(5)
  })

  it('runs sync function with dock (macOS)', () => {
    const electron = mockElectron({ withDock: true })
    electron.BrowserWindow.getAllWindows.returns([])
    const { runSync } = proxyquire('../../src/dock', { electron }).default
    const fn = sinon.stub().returns(5)
    const res = runSync(fn)
    expect(res).to.equal(5)
    expect(electron.app.dock.show.callCount).to.equal(1)
    expect(electron.app.dock.hide.callCount).to.equal(1)
    expect(electron.app.dock.show.calledBefore(electron.app.dock.hide)).to.equal(true)
  })

  it('runs sync function without dock (other OSes)', () => {
    const electron = mockElectron()
    electron.BrowserWindow.getAllWindows.returns([])
    const { runSync } = proxyquire('../../src/dock', { electron }).default
    const fn = sinon.stub().returns(5)
    const res = runSync(fn)
    expect(res).to.equal(5)
  })
})
