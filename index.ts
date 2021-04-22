// import * as github from '@actions/github'
import * as core from '@actions/core'
import { AppProps, Errors } from './src/App.types'
import App from './src/App'

export const configMsg = '. Configure Github secrets please'

export const run = (): void => {
    try {
        const errors: string[] = []
        const {
            nowUsername = '',
            nowPassword = '',
            nowInstallInstance = '',
            appSysID = '',
            appScope = '',
        } = process.env

        if (!nowUsername) {
            errors.push(Errors.USERNAME)
        }
        if (!nowPassword) {
            errors.push(Errors.PASSWORD)
        }
        if (!nowInstallInstance) {
            errors.push(Errors.INSTALL_INSTANCE)
        }
        if (!appScope && !appSysID) {
            errors.push(Errors.SYSID_OR_SCOPE)
        }
        if (errors.length) {
            core.setFailed(`${errors.join('. ')}${configMsg}`)
        } else {
            const props: AppProps = {
                appSysID,
                nowInstallInstance,
                username: nowUsername,
                password: nowPassword,
                scope: appScope,
            }
            const app = new App(props)

            app.rollbackApp().catch(error => {
                core.setFailed(error.message)
            })
        }
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
