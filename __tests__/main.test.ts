/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core'
import * as main from '../src/main'

const mockAccess = jest.fn()
const mockRemoveDir = jest.fn()
const mockUploadFromDir = jest.fn()
const mockClose = jest.fn()

jest.mock('basic-ftp', () => ({
  Client: jest.fn().mockImplementation(() => ({
    access: mockAccess,
    removeDir: mockRemoveDir,
    uploadFromDir: mockUploadFromDir,
    close: mockClose
  })),
  FTPError: class extends Error {
    code: number

    constructor(message: string, code: number) {
      super(message)
      this.code = code
    }
  }
}))

const runMock = jest.spyOn(main, 'run')

let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let consoleLogMock: jest.SpiedFunction<typeof console.log>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(core, 'getInput').mockImplementation(name => {
      switch (name) {
        case 'host':
          return 'ftp.example.com'
        case 'user':
          return 'deploy'
        case 'port':
          return '21'
        case 'password':
          return 'secret'
        case 'timeout':
          return '5000'
        case 'src_path':
          return './dist'
        case 'dst_path':
          return '/remote/dist'
        default:
          return ''
      }
    })
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation()
  })

  it('connects to ftp and uploads directory', async () => {
    mockAccess.mockResolvedValue(undefined)
    mockRemoveDir.mockResolvedValue(undefined)
    mockUploadFromDir.mockResolvedValue(undefined)

    await main.run()

    expect(runMock).toHaveReturned()
    expect(mockAccess).toHaveBeenCalledWith({
      host: 'ftp.example.com',
      user: 'deploy',
      password: 'secret',
      secure: false,
      secureOptions: undefined,
      port: 21
    })
    expect(mockRemoveDir).toHaveBeenCalledWith('/remote/dist')
    expect(mockUploadFromDir).toHaveBeenCalledWith('./dist', '/remote/dist')
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(setFailedMock).not.toHaveBeenCalled()
    expect(consoleLogMock).toHaveBeenCalledWith(
      'Directory /remote/dist removed'
    )
    expect(consoleLogMock).toHaveBeenCalledWith('Directory successfuly sync!')
  })

  it('sets failed status when ftp access throws', async () => {
    mockAccess.mockRejectedValue(new Error('connect failed'))

    await main.run()

    expect(runMock).toHaveReturned()
    expect(mockRemoveDir).not.toHaveBeenCalled()
    expect(mockUploadFromDir).not.toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(setFailedMock).toHaveBeenCalledWith('connect failed')
    expect(consoleLogMock).toHaveBeenCalledWith('connect failed')
  })
})
