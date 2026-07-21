import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import FAQPage from '../../pages/public/FAQPage'

describe('FAQPage', () => {
  it('renders without crashing', () => {
    render(<FAQPage />)
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
  })

  it('renders FAQ items', () => {
    render(<FAQPage />)
    expect(screen.getByText('What is Madrasah LMS?')).toBeInTheDocument()
    expect(screen.getByText('Is the platform free?')).toBeInTheDocument()
  })

  it('toggles answer on click', async () => {
    const user = userEvent.setup()
    render(<FAQPage />)
    const question = screen.getByText('What is Madrasah LMS?')
    await user.click(question)
    expect(screen.getByText(/A comprehensive Islamic school/)).toBeInTheDocument()
  })

  it('has a back to home link', () => {
    render(<FAQPage />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })
})
