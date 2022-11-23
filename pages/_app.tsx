import 'fonts/inter.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { darkTheme, globalReset } from 'stitches.config'
import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  getDefaultWallets,
  darkTheme as rainbowDarkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiConfig, createClient, configureChains, chain } from 'wagmi'

import * as Tooltip from '@radix-ui/react-tooltip'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { KeyShortcutProvider } from 'react-key-shortcuts'

import {
  ReservoirKitProvider,
  darkTheme as resKitTheme,
} from '@reservoir0x/reservoir-kit-ui'
import { FC } from 'react'

const { chains, provider } = configureChains(
  [chain.mainnet, chain.rinkeby],
  [
    alchemyProvider({ alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID }),
    publicProvider(),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'Superset',
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

const theme = resKitTheme({
  headlineFont: 'Figtree',
  font: 'Figtree',
  primaryColor: '#6E56CB',
  primaryHoverColor: '#644fc1',
})

const rainbowKitTheme = rainbowDarkTheme({
  borderRadius: 'small',
})

function MyApp({ Component, pageProps }: AppProps) {
  globalReset()

  const FunctionalComponent = Component as FC

  return (
    <KeyShortcutProvider
      shortcuts={{
        search: 'command+k',
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        value={{
          dark: darkTheme.className,
          light: 'light',
        }}
      >
        <WagmiConfig client={wagmiClient}>
          <ReservoirKitProvider
            options={{
              apiBase: process.env.NEXT_PUBLIC_RESERVOIR_API_BASE as string,
              apiKey: process.env.NEXT_PUBLIC_RESERVOIR_API_KEY,
            }}
            theme={theme}
          >
            <Tooltip.Provider>
              <RainbowKitProvider
                chains={chains}
                theme={rainbowKitTheme}
                modalSize="compact"
              >
                <FunctionalComponent {...pageProps} />
              </RainbowKitProvider>
            </Tooltip.Provider>
          </ReservoirKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </KeyShortcutProvider>
  )
}

export default MyApp
