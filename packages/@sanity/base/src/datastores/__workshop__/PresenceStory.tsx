import {Box, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {GlobalPresence} from '../presence'
import {useDatastores} from '../useDatastores'

export default function PresenceStory() {
  const {presenceStore} = useDatastores()
  const [globalPresence, setGlobalPresence] = useState<GlobalPresence[] | null>(null)

  useEffect(() => {
    const sub = presenceStore.globalPresence$.subscribe(setGlobalPresence)

    return () => sub.unsubscribe()
  }, [presenceStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="semibold">
        <code>{`presenceStore.globalPresence$`}</code>
      </Text>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(globalPresence, null, 2)}
        </Code>
      </Box>
    </Box>
  )
}
