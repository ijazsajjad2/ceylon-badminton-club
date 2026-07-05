import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionHeading from './SectionHeading.jsx'

describe('SectionHeading', () => {
  it('renders the eyebrow, title, accent, and lead', () => {
    render(<SectionHeading eyebrow="Every single week" title="Weekly" accent="Sessions" lead="Two nights on court." />)
    expect(screen.getByText('Every single week')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Weekly Sessions')
    expect(screen.getByText('Sessions')).toHaveClass('accent')
    expect(screen.getByText('Two nights on court.')).toBeInTheDocument()
  })

  it('omits the lead paragraph when none is given', () => {
    render(<SectionHeading title="Club" accent="Stats" />)
    expect(screen.queryByText(/court/)).not.toBeInTheDocument()
  })
})
