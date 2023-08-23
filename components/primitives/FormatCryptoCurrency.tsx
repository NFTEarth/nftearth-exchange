import FormatCrypto from './FormatCrypto'
import React, { FC, ComponentProps } from 'react'
import CryptoCurrencyIcon from './CryptoCurrencyIcon'
import { zeroAddress } from 'viem'

type FormatCryptoCurrencyProps = {
  logoHeight?: number
  address?: string,
  chainId?: number
}

type Props = ComponentProps<typeof FormatCrypto> & FormatCryptoCurrencyProps

const FormatCryptoCurrency: FC<Props> = ({
  amount,
  address = zeroAddress,
  maximumFractionDigits,
  logoHeight = 8,
  chainId,
  textStyle,
  css,
  decimals,
}) => {
  return (
    <FormatCrypto
      css={css}
      textStyle={textStyle}
      amount={amount}
      maximumFractionDigits={maximumFractionDigits}
      decimals={decimals}
    >
      <CryptoCurrencyIcon css={{ height: logoHeight }} address={address} chainId={chainId}/>
    </FormatCrypto>
  )
}

export default FormatCryptoCurrency
