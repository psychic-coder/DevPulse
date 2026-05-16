import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthContext } from './context/AuthContext'

interface ProviderProps {
  children?: React.ReactNode
}

const customRender = (
  ui: ReactElement,
  { providerProps, ...renderOptions }: RenderOptions & { providerProps?: any } = {}
) => {
  const defaultProvider = {
    user: null,
    token: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    fetchWithAuth: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  }

  return render(
    <AuthContext.Provider value={{ ...defaultProvider, ...(providerProps || {}) }}>
      {ui}
    </AuthContext.Provider>,
    renderOptions
  )
}

export * from '@testing-library/react'
export { customRender as render }
