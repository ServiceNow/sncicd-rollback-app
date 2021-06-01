import * as core from '@actions/core'
import axios from 'axios'
import App from '../App'
import { AppProps, axiosConfig, Errors, requestOptions, RequestResponse } from '../App.types'

describe(`App lib`, () => {
    let props: AppProps
    const inputs: any = {
        version: '1.0.1',
    }

    beforeAll(() => {
        jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
            return inputs[name]
        })

        // Mock error/warning/info/debug
        jest.spyOn(core, 'error').mockImplementation(jest.fn())
        jest.spyOn(core, 'warning').mockImplementation(jest.fn())
        jest.spyOn(core, 'info').mockImplementation(jest.fn())
        jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    })

    beforeEach(() => {
        props = { appSysID: '', password: '', scope: '', nowInstallInstance: 'test', username: '' }
    })
    describe(`builds request url`, () => {
        it(`with correct params`, () => {
            props.appSysID = '123'

            const options: requestOptions = { sys_id: props.appSysID, version: '1.1.1' }
            const app = new App(props)

            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/rollback?sys_id=${options.sys_id}&version=${options.version}`,
            )
        })
        it(`without instance parameter`, () => {
            props.nowInstallInstance = ''
            props.appSysID = '123'
            const options: requestOptions = { scope: props.scope, sys_id: props.appSysID, version: '1.1.1' }
            const app = new App(props)

            expect(() => app.buildRequestUrl(options)).toThrow(Errors.INCORRECT_CONFIG)
        })
        it(`with just sys_id parameter`, () => {
            props.appSysID = '123'
            const options: requestOptions = { sys_id: props.appSysID, version: '1.1.1' }
            const app = new App(props)

            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/rollback?sys_id=${options.sys_id}&version=${options.version}`,
            )
        })
        it(`with just scope parameter`, () => {
            props.scope = '123'
            const options: requestOptions = { scope: props.scope, version: '1.1.1' }
            const app = new App(props)

            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/rollback?scope=${options.scope}&version=${options.version}`,
            )
        })
    })

    it(`Install app`, () => {
        const post = jest.spyOn(axios, 'post')
        const response: RequestResponse = {
            data: {
                result: {
                    links: {
                        progress: {
                            id: 'id',
                            url: 'http://test.xyz',
                        },
                    },
                    status: '2',
                    status_label: 'success',
                    status_message: 'label',
                    status_detail: 'detail',
                    error: '',
                    percent_complete: 100,
                    rollback_version: '1.0.0',
                },
            },
        }
        post.mockResolvedValue(response)
        jest.spyOn(global.console, 'log')
        props.appSysID = '123'
        const app = new App(props)
        app.rollbackApp()
        const config: axiosConfig = {
            auth: {
                username: props.username,
                password: props.password,
            },
            headers: {
                'User-Agent': 'sncicd_extint_github',
                Accept: 'application/json',
            },
        }
        const url = `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/rollback?sys_id=${props.appSysID}&version=${inputs.version}`
        expect(post).toHaveBeenCalledWith(url, {}, config)
    })
    describe(`getInputVersion`, () => {
        it(`success`, () => {
            props.appSysID = '123'
            const app = new App(props)
            expect(app.getInputVersion()).toEqual('1.0.1')
        })
        it(`throws an error`, () => {
            props.appSysID = '123'
            inputs.version = undefined
            const app = new App(props)
            expect(() => app.getInputVersion()).toThrow(Errors.MISSING_VERSION)
        })
    })
    // it(`sleep throttling`, async done => {
    //     props.appSysID = '123'
    //     const app = new App(props)
    //     const time = 2500
    //     setTimeout(() => done(new Error("it didn't resolve or took longer than expected")), time)
    //     await app.sleep(time - 500)
    //     done()
    // })
})
