import {Schema} from '@sanity/types'
import React from 'react'
import {useSource} from '../../studio'
import {FIXME, FormPreviewComponentResolver} from '../types'
import {SanityPreview} from '../../preview'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {PatchChannel} from '../patch/PatchChannel'

const previewResolver: FormPreviewComponentResolver = (..._: unknown[]) => {
  // @todo: Implement correct typing here
  return SanityPreview as FIXME
}

/**
 * @alpha This API might change.
 */
export interface StudioFormBuilderProviderProps {
  /**
   * @internal Considered internal, do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  children: React.ReactElement
  schema: Schema
  value: any | null
}

/**
 * Default wiring for `FormBuilderProvider` when used with Sanity
 *
 * @alpha This API might change.
 */
export function StudioFormBuilderProvider(props: StudioFormBuilderProviderProps) {
  const {__internal_patchChannel: patchChannel, children, schema, value} = props

  const {formBuilder} = useSource()

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      schema={schema}
      value={value}
      {...formBuilder}
    >
      {children}
    </FormBuilderProvider>
  )
}