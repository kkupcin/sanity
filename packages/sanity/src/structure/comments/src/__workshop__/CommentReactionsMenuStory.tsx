import {useCallback, useState} from 'react'
import {CommentReactionsMenu} from '../components'
import {CommentReactionOption, CommentReactionShortNames} from '../types'
import {COMMENT_REACTION_OPTIONS} from '../constants'

export default function CommentReactionsMenuStory() {
  const [selectedOptions, setSelectedOptions] = useState<CommentReactionShortNames[]>([])

  const handleOnSelect = useCallback(
    (option: CommentReactionOption) => {
      const hasOption = selectedOptions.includes(option.shortName)

      if (hasOption) {
        setSelectedOptions((prev) => prev.filter((o) => o !== option.shortName))
      } else {
        setSelectedOptions((prev) => [...prev, option.shortName])
      }
    },
    [selectedOptions],
  )

  return (
    <div>
      <CommentReactionsMenu onSelect={handleOnSelect} options={COMMENT_REACTION_OPTIONS} />
    </div>
  )
}
