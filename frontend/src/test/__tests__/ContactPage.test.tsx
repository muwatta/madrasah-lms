import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import ContactPage from '../../pages/public/ContactPage'

describe('ContactPage', () => {
  it('renders without crashing', () => {
    render(<ContactPage />)
    expect(screen.getAllByText("Contact Us").length).toBeGreaterThanOrEqual(1)
  })

  it('renders the contact form', () => {
    render(<ContactPage />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Message')).toBeInTheDocument()
  })

  it('has a submit button', () => {
    render(<ContactPage />)
    expect(screen.getByText('Send Message')).toBeInTheDocument()
  })
})
