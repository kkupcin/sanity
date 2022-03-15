import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'
import React from 'react'

declare const __DEV__: boolean

interface DiffErrorBoundaryProps {
  children: React.ReactNode
}

interface DiffErrorBoundaryState {
  error?: Error
}

export class DiffErrorBoundary extends React.Component<
  DiffErrorBoundaryProps,
  DiffErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error) {
    return {error}
  }

  state: DiffErrorBoundaryState = {}

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: Error) {
    console.error('Error rendering diff component: ')
    console.error(error)
  }

  render() {
    const {error} = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <Card padding={3} radius={2} tone="critical">
        <Flex>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>

          <Box paddingLeft={3}>
            <Text as="h3" size={1} weight="medium">
              Rendering the changes to this field caused an error
            </Text>

            {__DEV__ && (
              <Box marginTop={2}>
                <Text as="p" size={1}>
                  Check the developer console for more information
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Card>
    )
  }
}
