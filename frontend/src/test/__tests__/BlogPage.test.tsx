import { describe, it, expect } from 'vitest'
import { render, screen } from '../test-utils'
import BlogPage from '../../pages/public/BlogPage'

describe('BlogPage', () => {
  it('renders without crashing', () => {
    render(<BlogPage />)
    expect(screen.getByText('Blog')).toBeInTheDocument()
  })

  it('renders blog post titles', () => {
    render(<BlogPage />)
    expect(screen.getByText('Getting Started with Madrasah LMS')).toBeInTheDocument()
    expect(screen.getByText('The Importance of Technology in Islamic Education')).toBeInTheDocument()
  })

  it('has a back to home link', () => {
    render(<BlogPage />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })
})
