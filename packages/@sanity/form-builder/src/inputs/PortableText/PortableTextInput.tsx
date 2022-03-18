import {FormField} from '@sanity/base/components'
import type {
  FormInputProps,
  Patch as FormBuilderPatch,
  PortableTextMarker,
  RenderCustomMarkers,
} from '@sanity/base/form'
import {PatchEvent} from '@sanity/base/form'
import {Path} from '@sanity/types'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  Type,
  HotkeyOptions,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {Subject} from 'rxjs'
import {Box, Text, useToast} from '@sanity/ui'
import scrollIntoView from 'scroll-into-view-if-needed'
import {withPatchSubscriber} from '../../utils/withPatchSubscriber'
import {RenderBlockActions} from './types'
import {Compositor} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'

export type PatchWithOrigin = FormBuilderPatch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

type PatchSubscribe = (subscribeFn: PatchSubscriber) => () => void
type PatchSubscriber = ({
  patches,
}: {
  patches: PatchWithOrigin[]
  snapshot: PortableTextBlock[] | undefined
}) => void

/**
 * @alpha
 */
export interface PortableTextInputProps extends FormInputProps<PortableTextBlock[], Type> {
  hotkeys?: HotkeyOptions
  markers?: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
}

/**
 * An outer React PureComponent Class purely to satisfy the form-builder's need for 'blur' and 'focus' class methods.
 *
 * @alpha
 */
export const PortableTextInput = withPatchSubscriber(
  class PortableTextInput extends React.PureComponent<
    PortableTextInputProps & {children: React.ReactNode; subscribe: PatchSubscribe}
  > {
    editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    focus() {
      if (this.editorRef.current) {
        PortableTextEditor.focus(this.editorRef.current)
      }
    }
    blur() {
      if (this.editorRef.current) {
        PortableTextEditor.blur(this.editorRef.current)
      }
    }
    render() {
      const {type, level, validation, presence} = this.props
      return (
        <FormField
          __unstable_changeIndicator={false}
          validation={validation}
          __unstable_presence={presence}
          description={type.description}
          level={level}
          title={type.title}
        >
          <PortableTextInputController {...this.props} ref={this.editorRef} />
        </FormField>
      )
    }
  }
) as React.ComponentType as React.ComponentType<PortableTextInputProps>

const PortableTextInputController = React.forwardRef(function PortableTextInputController(
  props: PortableTextInputProps & {subscribe: PatchSubscribe},
  ref: React.RefObject<PortableTextEditor>
) {
  const {
    compareValue,
    focusPath,
    hotkeys,
    level,
    markers = [],
    validation,
    onBlur,
    onChange,
    onCopy,
    onFocus,
    onPaste,
    presence,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value,
    subscribe,
  } = props

  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toast = useToast()

  // Memoized patch stream
  const patches$: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const patchObservable = useMemo(() => patches$.asObservable(), [patches$])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v)
    PortableTextEditor.focus(ref.current)
  }, [ref])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Handle incoming patches from withPatchSubscriber HOC
  const handleDocumentPatches = useCallback(
    ({patches}: {patches: PatchWithOrigin[]; snapshot: PortableTextBlock[] | undefined}): void => {
      const patchSelection =
        patches && patches.length > 0 && patches.filter((patch) => patch.origin !== 'local')
      if (patchSelection) {
        patchSelection.map((patch) => patches$.next(patch))
      }
    },
    [patches$]
  )

  // Subscribe to incoming patches
  useEffect(() => {
    const unsubscribe = subscribe(handleDocumentPatches)
    return () => unsubscribe()
  }, [handleDocumentPatches, subscribe])

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          setTimeout(() => {
            onChange(PatchEvent.from(change.patches as FormBuilderPatch[]))
          })
          break
        case 'selection':
          if (shouldSetEditorFormBuilderFocus(ref.current, change.selection, focusPath)) {
            onFocus(change.selection.focus.path)
          }
          break
        case 'focus':
          setHasFocus(true)
          onFocus(PortableTextEditor.getSelection(ref.current)?.focus.path || [])
          break
        case 'blur':
          setHasFocus(false)
          onBlur()
          break
        case 'undo':
        case 'redo':
          setTimeout(() => {
            onChange(PatchEvent.from(change.patches as FormBuilderPatch[]))
          })
          break
        case 'invalidValue':
          setInvalidValue(change)
          break
        case 'error':
          toast.push({
            status: change.level,
            description: change.description,
          })
          break
        default:
      }
    },
    [focusPath, onBlur, onChange, onFocus, ref, toast]
  )

  const handleFocusSkipperClick = useCallback(() => {
    if (ref.current) {
      PortableTextEditor.focus(ref.current)
    }
  }, [ref])

  const handleIgnoreValidation = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue) {
      return (
        <Box marginBottom={2}>
          <RespondToInvalidContent
            onChange={handleEditorChange}
            onIgnore={handleIgnoreValidation}
            resolution={invalidValue.resolution}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreValidation, invalidValue])

  // Scroll to *the field* (not the editor) into view if we have focus in the field.
  // For internal editor scrolling see useScrollToFocusFromOutside and useScrollSelectionIntoView in
  // the Compositor component.
  useEffect(() => {
    if (focusPath && focusPath.length > 0 && innerElementRef.current) {
      scrollIntoView(innerElementRef.current, {
        scrollMode: 'if-needed',
      })
    }
  }, [focusPath])

  return (
    <div ref={innerElementRef}>
      {!readOnly && (
        <VisibleOnFocusButton onClick={handleFocusSkipperClick}>
          <Text>Go to content</Text>
        </VisibleOnFocusButton>
      )}
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextEditor
          ref={ref}
          incomingPatches$={patchObservable}
          onChange={handleEditorChange}
          maxBlocks={undefined} // TODO: from schema?
          readOnly={readOnly}
          type={type}
          value={value}
        >
          <Compositor
            compareValue={compareValue}
            focusPath={focusPath}
            hasFocus={hasFocus}
            hotkeys={hotkeys}
            isFullscreen={isFullscreen}
            level={level}
            markers={markers}
            validation={validation}
            onChange={onChange}
            onCopy={onCopy}
            onFocus={onFocus}
            onPaste={onPaste}
            onToggleFullscreen={handleToggleFullscreen}
            patches$={patches$}
            presence={presence}
            readOnly={readOnly}
            renderBlockActions={renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            value={value}
          />
        </PortableTextEditor>
      )}
    </div>
  )
})

function shouldSetEditorFormBuilderFocus(
  editor: PortableTextEditor,
  selection: EditorSelection | undefined,
  focusPath: Path
) {
  return (
    selection && // If we have something selected
    focusPath.slice(-1)[0] !== FOCUS_TERMINATOR && // Not if in transition to open modal
    PortableTextEditor.isObjectPath(editor, focusPath) === false // Not if this is pointing to an embedded object
  )
}
