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
    const port: number = Number(core.getInput('port'))
    const password: string = core.getInput('password')
    const timeout: number = Number(core.getInput('timeout'))
    const src_path: string = core.getInput('src_path')
    const dst_path: string = core.getInput('dst_path')

    const client = new FtpClient(timeout)
    // client.ftp.verbose = true

    try {
      await client.access({
        host: host,
        user: user,
        password: password,
        secure: false,
        secureOptions: undefined,
        port: port
      })

      await client
        .removeDir(dst_path)
        .then(() => {
          console.log(`Directory ${dst_path} removed`)
        })
        .catch(err => {
          console.log(`Failed to remove ${dst_path} directory`)
          if (err instanceof FTPError) {
            if (err.code === 550) {
              console.log(`Access denied!`)
              core.setFailed(err.message)
            }
          } else {
            core.setFailed('Unknown error while remove directory')
          }
        })

      await client
        .uploadFromDir(src_path, dst_path)
        .then(() => {
          console.log('Directory successfuly sync!')
        })
        .catch(err => {
          console.log(`Failed to copy to remote directory`)
          if (err instanceof FTPError) {
            if (err.code === 550) {
              console.log(`Access denied!`)
              core.setFailed(err.message)
            }
          } else {
            core.setFailed('Unknown error while copy files')
          }
        })
    } catch (err) {
      // if (err instanceof FTPError) {
      //   console.log(err.message)
      // }

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
