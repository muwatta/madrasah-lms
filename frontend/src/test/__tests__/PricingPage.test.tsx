import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import PricingPage from '../../pages/public/PricingPage'

describe('PricingPage', () => {
  it('renders without crashing', () => {
    render(<PricingPage />)
    expect(screen.getByText('Choose the Right Plan for Your Madrasah')).toBeInTheDocument()
  })

  it('renders pricing plans', () => {
    render(<PricingPage />)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('has Get Started buttons', () => {
    render(<PricingPage />)
    const buttons = screen.getAllByText('Get Started')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})
