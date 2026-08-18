import { useContext } from 'react'
import { FeedbackContext } from './feedbackContext'

export function useFeedback() {
  const context = useContext(FeedbackContext)

  if (!context) {
    throw new Error('useFeedback deve essere utilizzato all’interno di FeedbackProvider.')
  }

  return context
}
