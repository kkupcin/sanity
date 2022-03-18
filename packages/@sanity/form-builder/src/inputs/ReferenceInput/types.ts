import {Observable} from 'rxjs'
import React, {ReactNode} from 'react'
import {PreviewValue, Reference, ReferenceSchemaType} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'
import {FormInputProps} from '@sanity/base/form'

export interface ReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability
  preview: {
    draft: DocumentPreview | undefined
    published: DocumentPreview | undefined
  }
}

export interface ReferenceTemplate {
  id: string
  params?: ReferenceParams
}

export interface EditReferenceEvent {
  id: string
  type: string
  template: ReferenceTemplate
}

export type ReferenceParams = Record<string, string | number | boolean>

export interface CreateOption {
  id: string
  title: string
  icon?: React.ReactNode | React.ComponentType
  type: string
  template: ReferenceTemplate
  permission: {
    granted: boolean
    reason: string
  }
}

export interface DocumentPreview extends PreviewValue {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

export interface SearchState {
  hits: SearchHit[]
  searchString?: string
  isLoading: boolean
}

export type SearchFunction = (query: string) => Observable<SearchHit[]>

export interface SearchHit {
  id: string
  type: string
  draft?: {_id: string; _type: string}
  published?: {_id: string; _type: string}
}

export interface ReferenceInputProps<Value = Reference>
  extends FormInputProps<Value, ReferenceSchemaType> {
  id?: string
  suffix?: ReactNode
  liveEdit: boolean
  onSearch: SearchFunction
  selectedState?: 'selected' | 'pressed' | 'none'
  createOptions: CreateOption[]
  editReferenceLinkComponent: React.ComponentType<{documentId: string; documentType: string}>
  onEditReference: (event: EditReferenceEvent) => void
  getReferenceInfo: (id: string, type: ReferenceSchemaType) => Observable<ReferenceInfo>
}
