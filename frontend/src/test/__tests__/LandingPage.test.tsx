import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import LandingPage from '../../pages/public/LandingPage'

describe('LandingPage', () => {
  it('renders without crashing', () => {
    render(<LandingPage />)
    const logos = screen.getAllByText((_, el) => el?.textContent === 'MadrasahLMS')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('renders CTA button', () => {
    render(<LandingPage />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('renders footer section', () => {
    render(<LandingPage />)
    expect(screen.getByText('Platform')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
  })
})
