import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { render, type RenderOptions } from '@testing-library/react'
import { LanguageProvider } from '../context/LanguageContext'
import { ThemeProvider } from '../context/ThemeContext'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
