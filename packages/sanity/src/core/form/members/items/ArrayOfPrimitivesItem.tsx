import {isBooleanSchemaType, isNumberSchemaType} from '@sanity/types'
import React, {useCallback, useMemo, useRef} from 'react'
import {FIXME} from '../../../FIXME'
import {ArrayOfPrimitivesItemMember} from '../../store'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {getEmptyValue} from '../../inputs/arrays/ArrayOfPrimitivesInput/getEmptyValue'
import {
  PrimitiveInputProps,
  PrimitiveItemProps,
  RenderArrayOfPrimitivesItemCallback,
  RenderInputCallback,
} from '../../types'
import {insert, PatchArg, PatchEvent, set, unset} from '../../patch'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'

/**
 * @alpha
 */
export interface PrimitiveMemberItemProps {
  member: ArrayOfPrimitivesItemMember
  renderItem: RenderArrayOfPrimitivesItemCallback
  renderInput: RenderInputCallback
}

/**
 * @alpha
 */
export function ArrayOfPrimitivesItem(props: PrimitiveMemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {member, renderItem, renderInput} = props

  const {onPathBlur, onPathFocus, onChange} = useFormCallbacks()

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur(member.item.path)
    },
    [member.item.path, onPathBlur]
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.item.path)
    },
    [member.item.path, onPathFocus]
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      const patches = PatchEvent.from(event).patches.map((patch) =>
        // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
        // note: this creates the rather "weird" case where the input renders ´0´ when you try to clear it
        patch.path.length === 0 && patch.type === 'unset'
          ? set(getEmptyValue(member.item.schemaType))
          : patch
      )
      onChange(PatchEvent.from(patches).prefixAll(member.index))
    },
    [onChange, member.item.schemaType, member.index]
  )

  const handleNativeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue: number | string | boolean = event.currentTarget.value
      if (isNumberSchemaType(member.item.schemaType)) {
        inputValue = event.currentTarget.valueAsNumber
      } else if (isBooleanSchemaType(member.item.schemaType)) {
        inputValue = event.currentTarget.checked
      }

      // `valueAsNumber` returns `NaN` on empty input
      const hasEmptyValue =
        inputValue === '' || (typeof inputValue === 'number' && isNaN(inputValue))

      onChange(PatchEvent.from(hasEmptyValue ? unset() : set(inputValue)).prefixAll(member.index))
    },
    [member.index, member.item.schemaType, onChange]
  )

  const elementProps = useMemo(
    (): PrimitiveInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.item.id,
      ref: focusRef,
      onChange: handleNativeChange,
      value: String(member.item.value || ''),
      readOnly: Boolean(member.item.readOnly),
      placeholder: member.item.schemaType.placeholder,
    }),
    [
      handleBlur,
      handleFocus,
      handleNativeChange,
      member.item.id,
      member.item.readOnly,
      member.item.schemaType.placeholder,
      member.item.value,
    ]
  )
  const inputProps = useMemo((): PrimitiveInputProps => {
    return {
      changed: member.item.changed,
      level: member.item.level,
      value: member.item.value as FIXME,
      readOnly: member.item.readOnly,
      schemaType: member.item.schemaType as FIXME,
      id: member.item.id,
      path: member.item.path,
      focused: member.item.focused,
      onChange: handleChange,
      validation: member.item.validation,
      presence: member.item.presence,
      elementProps,
    }
  }, [
    member.item.changed,
    member.item.level,
    member.item.value,
    member.item.readOnly,
    member.item.schemaType,
    member.item.id,
    member.item.path,
    member.item.focused,
    member.item.validation,
    member.item.presence,
    handleChange,
    elementProps,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const onRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([member.index])]))
  }, [member.index, onChange])

  const onInsert = useCallback(
    (event: {items: unknown[]; position: 'before' | 'after'}) => {
      onChange(PatchEvent.from([insert(event.items, event.position, [member.index])]))
    },
    [member.index, onChange]
  )

  const itemProps = useMemo((): PrimitiveItemProps => {
    return {
      key: member.key,
      index: member.index,
      level: member.item.level,
      value: member.item.value as FIXME,
      title: member.item.schemaType.title,
      description: member.item.schemaType.description,
      schemaType: member.item.schemaType as FIXME,
      onInsert,
      onRemove,
      presence: member.item.presence,
      validation: member.item.validation,
      readOnly: member.item.readOnly,
      focused: member.item.focused,
      onFocus: handleFocus,
      inputId: member.item.id,
      path: member.item.path,
      children: renderedInput,
    }
  }, [
    member.key,
    member.index,
    member.item.level,
    member.item.value,
    member.item.schemaType,
    member.item.presence,
    member.item.validation,
    member.item.readOnly,
    member.item.focused,
    member.item.id,
    member.item.path,
    onInsert,
    onRemove,
    handleFocus,
    renderedInput,
  ])

  return <>{useMemo(() => renderItem(itemProps), [itemProps, renderItem])}</>
}