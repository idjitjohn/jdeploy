import { Elysia, Static, TSchema, DocumentDecoration } from 'elysia'
import { Auth, AuthTypes } from '../plugins/auth.types'

export type AnyElysia = Elysia<any, any, any, any, any, any, any>
type ExtractDefs<App> = App extends Elysia<any, any, infer D, any, any, any, any> ? D extends { typebox: infer T } ? { typebox: T } : { typebox: {} } : { typebox: {} }
type ExtractSingleton<App> = App extends Elysia<any, infer S, any, any, any, any, any> ? S : { decorator: {}; store: {}; derive: {}; resolve: {} }

// Resolve schema - TSchema first, then model name lookup, then fallback
type ResolveHookSchema<App extends AnyElysia, T> =
  T extends TSchema ? Static<T> :
  T extends keyof ExtractDefs<App>['typebox']
    ? ExtractDefs<App>['typebox'][T] extends TSchema
      ? Static<ExtractDefs<App>['typebox'][T]>
      : ExtractDefs<App>['typebox'][T]
    : T

// Extract macroFn from App metadata
type ExtractMacroFn<App extends AnyElysia> = App extends Elysia<any, any, any, infer M, any, any, any>
  ? M extends { macroFn: infer F } ? F : {}
  : {}

// Call macro function with hook value and extract resolve return type
type MacroResolveResult<MacFn, HookValue> =
  MacFn extends (arg: HookValue) => infer Ret
    ? Ret extends { resolve: (...args: any[]) => Promise<infer R> } ? R
      : Ret extends { resolve: (...args: any[]) => infer R } ? R
      : {}
    : {}

// Extract resolved types from all macros in hook
type ExtractMacroResolve<App extends AnyElysia, Hook> = ExtractMacroFn<App> extends infer MacFn
  ? keyof Hook & keyof MacFn extends never
    ? {}
    : {
        [K in keyof Hook & keyof MacFn]: MacroResolveResult<MacFn[K], Hook[K]>
      }[keyof Hook & keyof MacFn] extends infer U
        ? [U] extends [never] ? {} : U
        : {}
  : {}

type ExtractMacros<App extends AnyElysia> = App extends Elysia<
  any, any, any, infer Metadata, any, any, any
> ? Metadata extends { macro: infer Mac } ? Mac : {} : {}

type ExtractModelNames<App extends AnyElysia> = keyof ExtractDefs<App>['typebox']

export type AppHook<App extends AnyElysia> = { [K in 'body' | 'query' | 'params' | 'headers' | 'response']?: TSchema | ExtractModelNames<App>} & {
  detail?: { summary?: string, description?: string, tags?: string[] }
} & ExtractMacros<App>

export type ServiceResponse<App extends AnyElysia, Hook> =
  Hook extends { response: infer R } ? ResolveHookSchema<App, R> : unknown

// Auth macro - specific typing (Auth enum -> AuthTypes mapping)
type AuthMacroResolve<Hook> = Hook extends { auth: infer T extends Auth } ? { authData: AuthTypes[T] } : {}

export type ServiceContext<App extends AnyElysia, Hook> = {
  body: Hook extends { body: infer B } ? ResolveHookSchema<App, B> : unknown
  query: Hook extends { query: infer Q } ? ResolveHookSchema<App, Q> : Record<string, string>
  params: Hook extends { params: infer P } ? ResolveHookSchema<App, P> : Record<string, string>
  headers: Record<string, string | undefined>
  cookie: Record<string, any>
  status: any
  set: {
    headers: Record<string, string | number>, status?: number | string
    redirect?: string, cookie?: Record<string, any>
  }
  request: Request
  path: string
  store: ExtractSingleton<App>['store']
} & ExtractSingleton<App>['decorator'] & ExtractSingleton<App>['derive'] & ExtractMacroResolve<App, Hook> & AuthMacroResolve<Hook>

export type RouteDetail  = Omit<DocumentDecoration, 'summary' | 'tags' | 'description'> & {
  summary: string
  description: string
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface ControllerBuilder<App extends AnyElysia> {
  get: <S extends ServiceResult<any, any>>(path: string, service: S, detail?: RouteDetail) => ControllerBuilder<App>
  post: <S extends ServiceResult<any, any>>(path: string, service: S, detail?: RouteDetail) => ControllerBuilder<App>
  put: <S extends ServiceResult<any, any>>(path: string, service: S, detail?: RouteDetail) => ControllerBuilder<App>
  patch: <S extends ServiceResult<any, any>>(path: string, service: S, detail?: RouteDetail) => ControllerBuilder<App>
  delete: <S extends ServiceResult<any, any>>(path: string, service: S, detail?: RouteDetail) => ControllerBuilder<App>
  build: () => App
}

export interface ServiceResult<Hook, Fn> { service: Fn, hook: Hook }
