import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import AboutPage from '../../pages/public/AboutPage'

describe('AboutPage', () => {
  it('renders without crashing', () => {
    render(<AboutPage />)
    expect(screen.getByText('About Madrasah LMS')).toBeInTheDocument()
  })

  it('renders mission section', () => {
    render(<AboutPage />)
    expect(screen.getByText('Our Mission')).toBeInTheDocument()
  })

  it('renders vision section', () => {
    render(<AboutPage />)
    expect(screen.getByText('Our Vision')).toBeInTheDocument()
  })

  it('renders values section', () => {
    render(<AboutPage />)
    expect(screen.getByText('Our Values')).toBeInTheDocument()
  })

  it('has a back to home link', () => {
    render(<AboutPage />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })

  it('renders language toggle button', () => {
    render(<AboutPage />)
    const buttons = screen.getAllByRole('button')
    const langBtn = buttons.find(b => b.textContent === 'ع' || b.textContent === 'EN')
    expect(langBtn).toBeTruthy()
  })
})
