import { Elysia } from 'elysia'
import { ServiceResult, AnyElysia, ControllerBuilder, HttpMethod, RouteDetail, ServiceContext, ServiceResponse, AppHook } from '../types/base'

export const createController = <App extends AnyElysia>(
  app: App,
  tags: string[] = []
): ControllerBuilder<App> => {
  let currentApp = app as AnyElysia

  const addRoute = (method: HttpMethod, path: string, service: ServiceResult<any, any>, detail?: RouteDetail) => {
    currentApp = (currentApp as any)[method](path, service.service, {
      ...service.hook,
      detail: {
        ...detail,
        tags
      }
    })
  }

  const builder: ControllerBuilder<App> = {
    get: (path, service, detail) => { addRoute('get', path, service, detail); return builder },
    post: (path, service, detail) => { addRoute('post', path, service, detail); return builder },
    put: (path, service, detail) => { addRoute('put', path, service, detail); return builder },
    patch: (path, service, detail) => { addRoute('patch', path, service, detail); return builder },
    delete: (path, service, detail) => { addRoute('delete', path, service, detail); return builder },
    build: () => currentApp as App
  }

  return builder
}

export const createService = <App extends Elysia<any, any, any, any, any, any, any>>(app: App) =>
  <const Hook extends AppHook<App>>(
    hook: Hook,
    fn: (ctx: ServiceContext<App, Hook>) => ServiceResponse<App, Hook> | Promise<ServiceResponse<App, Hook>>
  ): ServiceResult<Hook, typeof fn> => ({
    service: fn,
    hook
  })
