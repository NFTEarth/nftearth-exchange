import Link from 'next/link'
import Image from 'next/image'
import { Box, Button, Flex, Grid, Text } from './primitives'
import { FC } from 'react'
import { useTheme } from 'next-themes'

interface IProp {
  hideLink?: boolean
}

const HeroSection: FC<IProp> = ({ hideLink }) => {
  const { theme } = useTheme()

  return (
    <Flex
      as="section"
      css={{
        width: '100%',
        backgroundPosition: 'center center',
        backgroundImage: `linear-gradient(109.6deg, #000 11.2%, $primary13 91.1%), url('/images/heroSectionBanner.png')`,
        backgroundSize: 'cover',
        '@xs': {
          gridTemplateColumns: 'unset',
          padding: '64px 24px',
        },
        '@lg': {
          gridTemplateColumns: 'repeat(2, 1fr)',
          padding: '100px 64px',
        },
      }}
    >
      <Grid
        css={{
          gap: 32,
          '@xs': {
            flex: 1,
          },
          '@lg': {
            flex: 0.5,
          },
        }}
      >
        <Flex align="center" css={{ gap: 20 }}>
          <Text
            style={{
              '@initial': 'h2',
              '@lg': 'h1'
            }}
            as="h1"
            css={{
              color: '$whiteA12', lineHeight: 1.2
            }}
          >
            NFTΞarth
          </Text>
          <Image
            src="/res2.png"
            width={55}
            height={55}
            alt="NFTEarth Logo"
          />
        </Flex>

        <Text
          style="subtitle1"
          css={{
            lineHeight: 1.5,
            color: '$whiteA12',
            width: '100%',
            '@lg': { width: '50%' },
          }}
        >
          {`Trade and Create NFTs on the Omnichain web3 NFT hub. Earn Rewards.`}
        </Text>
        {hideLink ?? (
          <Flex css={{ gap: 10 }}>
            <Link href="/portfolio" passHref legacyBehavior>
              <Button
                as="a"
                color={'ghost'}
                corners="pill"
                size="large"
                css={{
                  width: 100,
                  borderRadius: '$lg',
                  color: 'white',
                  justifyContent: 'center',
                  border: '2px solid #79ffA8'
                }}
              >
                Trade
              </Button>
            </Link>
            {/*<Link href="/explore" passHref legacyBehavior>
              <Button
                as="a"
                color={'ghost'}
                corners="pill"
                size="large"
                css={{
                  width: 100,
                  borderRadius: '$lg',
                  color: 'white',
                  border: '2px solid #6BE481',
                  justifyContent: 'center'
                }}
              >
                Explore
              </Button>
            </Link>*/}
          </Flex>
        )}
      </Grid>
    </Flex>
  )
}

export default HeroSection
