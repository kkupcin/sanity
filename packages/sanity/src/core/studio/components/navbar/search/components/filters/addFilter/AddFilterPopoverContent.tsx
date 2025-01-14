import {Box, Flex, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {
  CommandList,
  CommandListGetItemDisabledCallback,
  CommandListRenderItemCallback,
} from '../../../../../../../components'
import {useSchema} from '../../../../../../../hooks'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterMenuItem} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {FilterPopoverContentHeader} from '../common/FilterPopoverContentHeader'
import {useTranslation} from '../../../../../../../i18n'
import {createFilterMenuItems} from './createFilterMenuItems'
import {MenuItemFilter} from './items/MenuItemFilter'
import {MenuItemHeader} from './items/MenuItemHeader'

interface AddFilterPopoverContentProps {
  onClose: () => void
}

const POPOVER_STYLES = {width: '300px'}

export function AddFilterPopoverContent({onClose}: AddFilterPopoverContentProps) {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [titleFilter, setTitleFilter] = useState('')
  const {t} = useTranslation()

  const handleFilterChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => setTitleFilter(e.currentTarget.value),
    [setTitleFilter],
  )
  const handleFilterClear = useCallback(() => setTitleFilter(''), [])

  const schema = useSchema()

  const {
    state: {
      documentTypesNarrowed,
      definitions,
      filters,
      terms: {types},
    },
  } = useSearchState()

  const filteredMenuItems = useMemo(
    () =>
      createFilterMenuItems({
        documentTypesNarrowed,
        fieldDefinitions: definitions.fields,
        filterDefinitions: definitions.filters,
        schema,
        titleFilter,
        types,
        t,
      }),
    [documentTypesNarrowed, definitions.fields, definitions.filters, schema, titleFilter, types, t],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<FilterMenuItem>>(
    (item) => {
      if (item.type === 'filter') {
        return <MenuItemFilter item={item} onClose={onClose} paddingBottom={1} />
      }
      if (item.type === 'header') {
        return <MenuItemHeader item={item} />
      }
      return null
    },
    [onClose],
  )

  const getItemDisabled = useCallback<CommandListGetItemDisabledCallback>(
    (index) => {
      const filterItem = filteredMenuItems[index]
      return (
        filterItem.type !== 'filter' ||
        !!filters.find((f) => getFilterKey(f) === getFilterKey(filterItem.filter))
      )
    },
    [filteredMenuItems, filters],
  )

  const getItemKey = useCallback(
    (index: number) => {
      const menuItem = filteredMenuItems[index]
      switch (menuItem.type) {
        case 'filter':
          return [
            ...(menuItem.group ? [menuItem.group] : []), //
            getFilterKey(menuItem.filter),
          ].join('-')
        case 'header':
          return `${menuItem.type}-${menuItem.title}`
        default:
          return index
      }
    },
    [filteredMenuItems],
  )

  return (
    <Flex direction="column" style={POPOVER_STYLES}>
      {/* Filter header */}
      <FilterPopoverContentHeader
        ariaInputLabel={t('search.filter-by-title-aria-label')}
        onChange={handleFilterChange}
        onClear={handleFilterClear}
        ref={setInputElement}
        typeFilter={titleFilter}
      />

      <Flex>
        {filteredMenuItems.length > 0 && (
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('search.filters-aria-label', {count: filteredMenuItems.length})}
            autoFocus="input"
            getItemDisabled={getItemDisabled}
            getItemKey={getItemKey}
            inputElement={inputElement}
            itemHeight={45}
            items={filteredMenuItems}
            overscan={20}
            padding={1}
            paddingBottom={0}
            renderItem={renderItem}
          />
        )}

        {/* No results */}
        {filteredMenuItems.length == 0 && (
          <Box padding={3}>
            <Text muted size={1} textOverflow="ellipsis">
              {t('search.filter-no-matches-found', {filter: titleFilter})}
            </Text>
          </Box>
        )}
      </Flex>
    </Flex>
  )
}
