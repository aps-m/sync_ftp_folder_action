import * as core from '@actions/core'
import { Client as FtpClient, FTPError } from 'basic-ftp'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const host: string = core.getInput('host')
    const user: string = core.getInput('user')
    const port = Number(core.getInput('port'))
    const password: string = core.getInput('password')
    const timeout = Number(core.getInput('timeout'))
    const src_path: string = core.getInput('src_path')
    const dst_path: string = core.getInput('dst_path')

    const client = new FtpClient(timeout)
    // client.ftp.verbose = true

    try {
      await client.access({
        host,
        user,
        password,
        secure: false,
        secureOptions: undefined,
        port
      })

      try {
        await client.removeDir(dst_path)
        console.log(`Directory ${dst_path} removed`)
      } catch (err) {
        console.log(`Failed to remove ${dst_path} directory`)
        if (err instanceof FTPError) {
          if (err.code === 550 && err.message.includes('Directory not found')) {
            console.log(`${err.message}`)
          } else {
            core.setFailed(`FTP error (code ${err.code}): ${err.message}`)
          }
        } else {
          core.setFailed('Unknown error while remove directory')
        }
      }

      try {
        await client.uploadFromDir(src_path, dst_path)
        console.log('Directory successfuly sync!')
      } catch (err) {
        console.log(`Failed to copy to remote directory`)
        if (err instanceof FTPError) {
          core.setFailed(`FTP error (code ${err.code}): ${err.message}`)
        } else {
          core.setFailed('Unknown error while copy files')
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message)
        core.setFailed(err.message)
      } else {
        core.setFailed('Unknown error')
      }
    }

    client.close()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
