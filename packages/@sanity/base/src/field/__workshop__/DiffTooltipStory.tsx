import {Box} from '@sanity/ui'
import React from 'react'
import {DiffTooltip} from '../diff'

/**
 * @todo
 */
export default function DiffTooltipStory() {
  return (
    <Box padding={4}>
      <DiffTooltip {...({} as any)} />
    </Box>
  )
}
