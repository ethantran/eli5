/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as ConvexpostsRouteImport } from './routes/convexposts'
import { Route as AuthedRouteImport } from './routes/_authed'
import { Route as IndexRouteImport } from './routes/index'
import { Route as GuestChatRouteImport } from './routes/guest.chat'

const rootRouteImport = createRooRoute()

const ConvexpostsRoute = ConvexpostsRouteImport.update({
  id: '/convexposts',
  path: '/convexposts',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthedRoute = AuthedRouteImport.update({
  id: '/_authed',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const GuestChatRoute = GuestChatRouteImport.update({
  id: '/guest/chat',
  path: '/guest/chat',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof AuthedRoute
  '/convexposts': typeof ConvexpostsRoute
  '/guest/chat': typeof GuestChatRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof AuthedRoute
  '/convexposts': typeof ConvexpostsRoute
  '/guest/chat': typeof GuestChatRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authed': typeof AuthedRoute
  '/convexposts': typeof ConvexpostsRoute
  '/guest/chat': typeof GuestChatRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '' | '/convexposts' | '/guest/chat'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '' | '/convexposts' | '/guest/chat'
  id: '__root__' | '/' | '/_authed' | '/convexposts' | '/guest/chat'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthedRoute: typeof AuthedRoute
  ConvexpostsRoute: typeof ConvexpostsRoute
  GuestChatRoute: typeof GuestChatRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/convexposts': {
      id: '/convexposts'
      path: '/convexposts'
      fullPath: '/convexposts'
      preLoaderRoute: typeof ConvexpostsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authed': {
      id: '/_authed'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthedRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/guest/chat': {
      id: '/guest/chat'
      path: '/guest/chat'
      fullPath: '/guest/chat'
      preLoaderRoute: typeof GuestChatRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthedRoute: AuthedRoute,
  ConvexpostsRoute: ConvexpostsRoute,
  GuestChatRoute: GuestChatRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
