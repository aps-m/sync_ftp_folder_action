import { execFileSync } from 'node:child_process'
import { parseList } from 'basic-ftp'

describe('FTP directory listing compatibility and security', () => {
  it('preserves normal Unix files, directories and symbolic links', () => {
    const files = parseList(
      [
        '-rw-r--r-- 1 owner group 42 Jan 1 2020 file with spaces.txt',
        'drwxr-xr-x 2 owner group 4096 Jan 1 2020 directory',
        'lrwxrwxrwx 1 owner group 8 Jan 1 2020 link -> file.txt'
      ].join('\r\n')
    )

    expect(files).toHaveLength(3)
    expect(files[0]).toMatchObject({
      name: 'file with spaces.txt',
      size: 42,
      user: 'owner',
      group: 'group'
    })
    expect(files[0].isFile).toBe(true)
    expect(files[1].isDirectory).toBe(true)
    expect(files[2].isSymbolicLink).toBe(true)
    expect(files[2].link).toBe('file.txt')
  })

  it('bounds parsing time for hostile Unix listings', () => {
    // Use a child process so a vulnerable synchronous parser cannot hang Jest.
    // The valid final line selects the Unix parser for each malicious line.
    const script = `
      const assert = require('node:assert/strict')
      const { parseList } = require('basic-ftp')
      const valid = '-rw-r--r-- 1 owner group 42 Jan 1 2020 file.txt'
      for (const prefix of ['-rw-r--r-- 1 ', '123 -rw-r--r-- 1 ']) {
        const malicious = prefix + 'a '.repeat(65536) + '!'
        const files = parseList(malicious + '\\r\\n' + valid + '\\r\\n')
        assert.equal(files.length, 1)
        assert.equal(files[0].name, 'file.txt')
        assert.equal(files[0].size, 42)
      }
    `

    expect(() =>
      execFileSync(process.execPath, ['-e', script], {
        cwd: process.cwd(),
        timeout: 5000,
        stdio: 'pipe'
      })
    ).not.toThrow()
  })
})
