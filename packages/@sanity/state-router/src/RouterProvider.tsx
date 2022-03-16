import {isEqual} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {RouterContext} from './RouterContext'
import {IntentParameters, RouterContextValue, NavigateOptions, Router, RouterState} from './types'

/**
 * @public
 */
export interface RouterProviderProps {
  onNavigate: (opts: {path: string; replace?: boolean}) => void
  router: Router
  state: RouterState
  children: React.ReactNode
}

/**
 * @example
 * ```tsx
 * import {
 *   NavigateOptions,
 *   route,
 *   RouterProvider,
 *   RouterState
 * } from '@sanity/state-router'
 * import {useCallback, useMemo} from 'react'
 *
 * function Root() {
 *   const router = useMemo(() => route.create('/'), [])
 *
 *   const [state, setState] = useState<RouterState>({})
 *
 *   const handleNavigate = useCallback((
 *     path: string,
 *     options?: NavigateOptions
 *   ) => {
 *     console.log('navigate', path, options)
 *
 *     setState(router.decode(path))
 *   }, [router])
 *
 *   return (
 *     <RouterProvider
 *       onNavigate={handleNavigate}
 *       router={router}
 *       state={state}
 *     >
 *       <div>This is a routed application</div>
 *     </RouterProvider>
 *   )
 * }
 * ```
 *
 * @public
 */
export function RouterProvider(props: RouterProviderProps): React.ReactElement {
  const {onNavigate, router: routerProp, state: stateProp} = props
  const [state, setState] = useState<RouterState>(stateProp)
  const stateRef = useRef(state)

  const navigateUrl = useCallback(
    (opts: {path: string; replace?: boolean}) => {
      onNavigate(opts)
    },
    [onNavigate]
  )

  const resolveIntentLink = useCallback(
    (intentName: string, parameters?: IntentParameters): string => {
      const [params, payload] = Array.isArray(parameters) ? parameters : [parameters]
      return routerProp.encode({intent: intentName, params, payload})
    },
    [routerProp]
  )

  const resolvePathFromState = useCallback(
    (nextState: Record<string, unknown>): string => {
      return routerProp.encode(nextState)
    },
    [routerProp]
  )

  const navigate = useCallback(
    (nextState: Record<string, unknown>, options: NavigateOptions = {}) => {
      navigateUrl({path: resolvePathFromState(nextState), replace: options.replace})
    },
    [navigateUrl, resolvePathFromState]
  )

  const navigateIntent = useCallback(
    (intentName: string, params?: IntentParameters, options: NavigateOptions = {}) => {
      navigateUrl({path: resolveIntentLink(intentName, params), replace: options.replace})
    },
    [navigateUrl, resolveIntentLink]
  )

  const router: RouterContextValue = useMemo(
    () => ({
      navigate,
      navigateIntent,
      navigateUrl,
      resolveIntentLink,
      resolvePathFromState,
      state,
    }),
    [navigate, navigateIntent, navigateUrl, resolveIntentLink, resolvePathFromState, state]
  )

  // Update state as new `state` prop comes in
  useEffect(() => {
    const prevState = stateRef.current
    const nextState = stateProp

    if (!isEqual(nextState, prevState)) {
      setState(nextState)
    }
  }, [stateProp])

  return <RouterContext.Provider value={router}>{props.children}</RouterContext.Provider>
}