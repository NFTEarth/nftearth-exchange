import { Flex, Box, Text } from '../primitives'
import { FC } from 'react'

const QuestsSection: FC = () => {

  return (
    <Flex
      as="section"
      css={{
        width: '100%',
        backgroundPosition: 'center center',
        flexWrap: 'wrap',
        backgroundImage: `linear-gradient(109.6deg, rgb(0, 0, 0) 11.2%, $primary9 91.1%), url('/images/heroSectionBanner.png')`,
        borderRadius: '16px',
        '@xs': {
          padding: '0 50px',
        },
        '@lg': {
          padding: '40px 70px',
        },
      }}
    >
      <Box css={{
        '@sm': {
          marginTop: -100,
        },
        '@lg': {
          marginTop: -150,
        },
        transform: 'rotateZ(-20deg)'
      }}>
        <img src="/images/NFTQuest_1.png" />
      </Box>
        <Text
          css={{
            color: '$whiteA12',
            lineHeight: 1.2,
            '@xs': {
              textAlign: 'center',
              margin: 'auto',
              marginBottom: '$5',
              fontSize: '40px',
              fontWeight: '700'
            },
            '@sm': {
              fontSize: '50px',  
            },
            '@bp900': {
              margin: 'auto',
              textAlign: 'left',
              fontSize: '60px',
              fontWeight: '700'
            },
          }}
        >
         Earn XP, NFT Rewards and $NFTE!
      </Text>
    </Flex>
  )
}

export default QuestsSection