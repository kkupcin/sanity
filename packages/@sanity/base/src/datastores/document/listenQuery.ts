import {SanityClient} from '@sanity/client'
import {defer, partition, merge, of, throwError, asyncScheduler, Observable} from 'rxjs'
import {mergeMap, throttleTime, share, take} from 'rxjs/operators'
import {exhaustMapToWithTrailing} from 'rxjs-exhaustmap-with-trailing'
import {ReconnectEvent, WelcomeEvent, MutationEvent} from './types'

type Params = Record<string, string | number | boolean | string[]>

export interface ListenQueryOptions {
  tag?: string
  apiVersion?: string
}

const fetch = (client: SanityClient, query: string, params: Params, options: ListenQueryOptions) =>
  defer(() =>
    // getVersionedClient(options.apiVersion)
    client.observable.fetch(query, params, {
      tag: options.tag,
      filterResponse: true,
    })
  )

const listen = (client: SanityClient, query: string, params: Params, options: ListenQueryOptions) =>
  defer(() =>
    // getVersionedClient(options.apiVersion)
    client.listen(query, params, {
      events: ['welcome', 'mutation', 'reconnect'],
      includeResult: false,
      visibility: 'query',
      tag: options.tag,
    })
  ) as Observable<ReconnectEvent | WelcomeEvent | MutationEvent>

function isWelcomeEvent(
  event: MutationEvent | ReconnectEvent | WelcomeEvent
): event is WelcomeEvent {
  return event.type === 'welcome'
}

// todo: promote as building block for better re-use
// todo: optimize by patching collection in-place
export const listenQuery = (
  client: SanityClient,
  query: string,
  params: Params = {},
  options: ListenQueryOptions = {}
) => {
  const fetchOnce$ = fetch(client, query, params, options)

  const events$ = listen(client, query, params, options).pipe(
    mergeMap((ev, i) => {
      const isFirst = i === 0
      if (isFirst && !isWelcomeEvent(ev)) {
        // if the first event is not welcome, it is most likely a reconnect and
        // if it's not a reconnect something is very wrong
        return throwError(
          new Error(
            ev.type === 'reconnect'
              ? 'Could not establish EventSource connection'
              : `Received unexpected type of first event "${ev.type}"`
          )
        )
      }
      return of(ev)
    }),
    share()
  )

  const [welcome$, mutationAndReconnect$] = partition(events$, isWelcomeEvent)

  return merge(
    welcome$.pipe(take(1)),
    mutationAndReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true}))
  ).pipe(exhaustMapToWithTrailing(fetchOnce$))
}
