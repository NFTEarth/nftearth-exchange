import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {useAccount, useContractReads, useContractWrite, usePrepareContractWrite, useWaitForTransaction} from "wagmi";
import { formatEther, formatUnits, parseEther, parseUnits} from "viem";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSquarePlus} from "@fortawesome/free-solid-svg-icons";
import {useConnectModal} from "@rainbow-me/rainbowkit";
import {getPublicClient} from "@wagmi/core";
import {arbitrum} from "viem/chains";
import {MaxUint256, solidityPacked} from "ethers";
import Link from "next/link";
import {Abi} from "abitype";

import Layout from "components/Layout";
import {Box, Button, CryptoCurrencyIcon, Flex, Text, Tooltip} from "components/primitives";
import NumericalInput from "components/bridge/NumericalInput";

import {ToastContext} from "context/ToastContextProvider";

import {formatBN, formatNumber} from "utils/numbers";
import {OFT_CHAINS} from "utils/chains";
import {parseError} from "utils/error";

import ERC20Abi from 'artifact/ERC20Abi.json'
import Erc20WethAbi from 'artifact/Erc20WethAbi.json'
import UniProxyAbi from 'artifact/UniProxyAbi.json'
import {useDebounce} from "usehooks-ts";
import {useMounted} from "../../hooks";

const WETH_ADDRESS = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'

const ERC20 = ERC20Abi as Abi
const UniProxy = UniProxyAbi as Abi
const Erc20Weth = Erc20WethAbi as Abi

const PoolPage = () => {
  const mounted = useMounted()
  const { address} = useAccount()
  const { openConnectModal } = useConnectModal()
  const [valueWEth, setValueWEth] = useState<string>('0.0')
  const [valueNFTE, setValueNFTE] = useState<string>('0.0')
  const [changedValue, setChangedValue] = useState('')
  const publicClient = getPublicClient()
  const {addToast} = useContext(ToastContext)
  const debouncedValueWEth = useDebounce(valueWEth, 500)
  const debouncedValueNFTE = useDebounce(valueNFTE, 500)
  const isZeroValue = parseEther(`${+valueWEth}`) <= BigInt(0)

  const chain = OFT_CHAINS.find(p => p.id === arbitrum.id)

  const { data: allowanceData, refetch: refetchAllowance } = useContractReads({
    contracts: [
      {
        abi:  ERC20,
        address: WETH_ADDRESS as `0x${string}`,
        functionName:  'allowance',
        args: [address as `0x${string}`, chain?.LPNFTE as `0x${string}`],
      },
      {
        abi:  ERC20,
        address: chain?.address as `0x${string}`,
        functionName:  'allowance',
        args: [address as `0x${string}`, chain?.LPNFTE as `0x${string}`],
      }
    ],
    watch: false,
    allowFailure: true,
    enabled: !!address,
  })

  const { data: balanceData, refetch: refetchBalance } = useContractReads({
    contracts: [
      // Weth Balance
      {
        abi: ERC20,
        address: WETH_ADDRESS as `0x${string}`,
        chainId: arbitrum.id,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      },
      // NFTE LP Balance
      {
        abi: ERC20,
        address: chain?.LPNFTE as `0x${string}`,
        chainId: arbitrum.id,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      },
      // NFTE Balance
      {
        abi: ERC20,
        address: chain?.address as `0x${string}`,
        chainId: arbitrum.id,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }
    ],
    watch: true,
    allowFailure: true,
    enabled: !!address,
  })

  useEffect(() => {
    if (changedValue === '') {
      return;
    }

    const isWethChange = changedValue === 'weth'
    const value = parseEther(`${+(isWethChange ? debouncedValueWEth : debouncedValueNFTE)}`)

    if (value > BigInt(0)) {
      publicClient.readContract(
        {
          abi: UniProxy,
          address: chain?.uniProxy as `0x${string}`,
          functionName: 'getDepositAmount',
          args: [chain?.LPNFTE as `0x${string}`, isWethChange ? WETH_ADDRESS : chain?.address as `0x${string}`, value]
        }).then((res: any) => {
          if (isWethChange) {
            setValueNFTE(`${formatEther((BigInt(res[1] - res[0]) / BigInt(2)) + BigInt(res[0]), 'wei')}`)
          } else {
            setValueWEth(`${formatEther((BigInt(res[1] - res[0]) / BigInt(2)) + BigInt(res[0]), 'wei')}`)
          }
          setChangedValue('')
        })
    }
  }, [debouncedValueWEth, debouncedValueNFTE, changedValue])

  const [wethBalance, nfteLPbalance, nfteBalance] = balanceData || [] as any
  const [wethAllowance, nfteAllowance] = allowanceData || [] as any
  const wethValue = parseEther(`${+debouncedValueWEth}` || '0')
  const nfteValue = parseEther(`${+debouncedValueNFTE}` || '0')
  const requireWethAllowance = BigInt(wethAllowance?.result || 0) < wethValue;
  const requireNFTEAllowance = BigInt(nfteAllowance?.result || 0) < nfteValue;
  const isLackOfWeth = BigInt(wethBalance?.result || 0) < wethValue

  const { config, error: preparedError, refetch: refetchPrepareContract } = usePrepareContractWrite({
    enabled: !!address && !!chain?.xNFTE && !isZeroValue,
    address: chain?.uniProxy as `0x${string}`,
    abi: UniProxy,
    functionName: 'deposit',
    args: [nfteValue, wethValue, address, chain?.LPNFTE, [0,0,0,0]]
  })

  const { writeAsync, error, data, isLoading } = useContractWrite(config)

  const { writeAsync: approveWethAsync, isLoading: isLoadingWethApproval } = useContractWrite<typeof ERC20Abi, 'approve', undefined>({
    address: WETH_ADDRESS as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'approve',
    args:  [chain?.LPNFTE as `0x${string}`, MaxUint256],
  })

  const { writeAsync: approveNFTEAsync, isLoading: isLoadingNFTEApproval } = useContractWrite<typeof ERC20Abi, 'approve', undefined>({
    address: chain?.address as `0x${string}`,
    abi: ERC20Abi,
    functionName: 'approve',
    args:  [chain?.LPNFTE as `0x${string}`, MaxUint256],
  })

  const { writeAsync: wrapEthAsync, isLoading: isLoadingWrapEth } = useContractWrite<typeof Erc20Weth, 'deposit', undefined>({
    address: WETH_ADDRESS as `0x${string}`,
    abi: Erc20Weth,
    functionName: 'deposit',
    value: wethValue,
    args: [],
  })

  const { isLoading: isLoadingTransaction, isSuccess = true } = useWaitForTransaction({
    hash: data?.hash,
    enabled: !!data?.hash
  })

  const handleSetValue = (val: string) => {
    try {
      parseUnits(`${+val}`, 18);
      setValueWEth(val);
      setChangedValue('weth')
    } catch (e) {
      setValueWEth('0');
    }
  }

  const handleSetMaxValue = () => {
    const val = formatUnits(BigInt(wethBalance?.result || 0), 18)
    handleSetValue(val)
  }

  const handleSetNFTEValue = (val: string) => {
    try {
      parseUnits(`${+val}`, 18);
      setValueNFTE(val);
      setChangedValue('nfte')
    } catch (e) {
      setValueNFTE('0');
    }
  }

  const handleSetMaxNFTEValue = () => {
    const val = formatUnits(BigInt(nfteBalance?.result || 0), 18)
    handleSetNFTEValue(val)
  }

  const disableButton = isZeroValue || (!!preparedError && !requireNFTEAllowance && !requireWethAllowance) || isLoading || isLoadingWethApproval || isLoadingNFTEApproval || isLoadingWrapEth || isLoadingTransaction

  const buttonText = useMemo(() => {
    if (!address) {
      return 'Connect Wallet'
    }

    if (isLackOfWeth) {
      return 'Wrap ETH'
    }

    if (requireNFTEAllowance) {
      return 'Approve NFTE'
    }

    if (requireWethAllowance) {
      return 'Approve WETH'
    }

    if (preparedError) {
      const { message } = parseError(preparedError)

      return message
    }

    return 'Add Liquidity'
  }, [address, preparedError, isLackOfWeth, requireNFTEAllowance, requireWethAllowance]);

  const handleAddLiquidity = useCallback(async () => {
    try {
      if (!address) {
        await openConnectModal?.()
      }

      if (isLackOfWeth) {
        await wrapEthAsync?.()
          .then((res) => {
            return publicClient.waitForTransactionReceipt(
              {
                confirmations: 5,
                hash: res.hash
              }
            )
          }).then(async () => {
            await refetchAllowance();
            await refetchPrepareContract()
          })
      }

      if (requireNFTEAllowance) {
        await approveNFTEAsync?.()
          .then((res) => {
            return publicClient.waitForTransactionReceipt(
              {
                confirmations: 5,
                hash: res.hash
              }
            )
          }).then(async () => {
            await refetchAllowance();
            await refetchPrepareContract()
          })
      }

      if (requireWethAllowance) {
        await approveWethAsync?.()
          .then((res) => {
            return publicClient.waitForTransactionReceipt(
              {
                confirmations: 5,
                hash: res.hash
              }
            )
          }).then(async () => {
            await refetchAllowance();
            await refetchPrepareContract()
          })
      }

      await writeAsync?.()
        .then(() => {
          addToast?.({
            title: 'Success',
            status: 'success',
            description: "Add Liquidity Success!"
          })
        })
    } catch (e: any) {
      await refetchAllowance();
      await refetchPrepareContract()
      addToast?.({
        title: parseError(e).name,
        status: 'error',
        description: parseError(e).message
      })
    }
  }, [requireWethAllowance, requireNFTEAllowance, writeAsync, approveWethAsync, approveNFTEAsync, openConnectModal, addToast])

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <Flex
        direction="column"
        css={{
          '@md': {
            alignItems: 'center'
          }
        }}
      >
        <Flex
          css={{
            height: '1.25rem',
            mt: '1.75rem',
            mb: '1rem',
            gap: 10,
            mx: 16,
          }}
        >
          <Text
            style="subtitle1"
            css={{
              color: '$gray10'
            }}
            as={Link}
            href="/staking"
          >{`Stake`}</Text>
          <Text
            style="subtitle1"
            css={{
              color: '$gray10'
            }}
          >{`>`}</Text>
          <Text style="subtitle1">{`Liquidity Pool`}</Text>
        </Flex>
        <Flex
          direction="column"
          css={{
            p: '1rem 1rem 0.75rem 1rem',
            border: '1px solid $gray4',
            background: '$gray3',
            px: 16,
            borderRadius: 8,
            '@md': {
              width: 400
            }
          }}
        >
          <Flex
            justify="between"
            css={{
              width: '100%'
            }}
          >
            <Text style="h6">Add Liquidity</Text>
            <Flex
              align="center"
              css={{
                gap: 5,
                background: '$gray11',
                px: 10,
                borderRadius: 8
              }}
            >
              <img src="/icons/arbitrum-icon-dark.svg" width={14} height={14}  alt="Arbitrum"/>
              <Text style="body3" color="dark">Arbitrum</Text>
            </Flex>
          </Flex>
          <Flex
            direction="column"
            css={{
              gap: 20
            }}
          >
            <Flex
              direction="column"
              css={{
                gap: 5,
                mt: 20
              }}
            >
              <Flex
                justify="between"
              >
                <Text style="body3">Amount</Text>
                <Text style="body3">{`Balance: ${formatBN(wethBalance?.result?.toString() || 0, 4, 18 || 10)}`}</Text>
              </Flex>
              <Box
                css={{
                  position: 'relative'
                }}
              >
                <NumericalInput
                  value={valueWEth}
                  onUserInput={handleSetValue}
                  icon={<Button size="xs" onClick={() => handleSetMaxValue()}>MAX</Button>}
                  iconStyles={{
                    top: 4,
                    right: 4,
                    left: 'auto'
                  }}
                  containerCss={{
                    width: '100%'
                  }}
                  css={{
                    pl: 40,
                    pr: 80,
                    boxShadow: 'inset 0 0 0 2px'
                  }}
                />
                <CryptoCurrencyIcon
                  address={WETH_ADDRESS as `0x${string}`}
                  chainId={arbitrum.id}
                  css={{
                    position: 'absolute',
                    width: 25,
                    height: 25,
                    top: 10,
                    left: 10
                  }}
                />
              </Box>
            </Flex>
            <Flex
              align="center"
              justify="center"
            >
              <FontAwesomeIcon icon={faSquarePlus} style={{ height: 40, width: 40}}/>
            </Flex>
            <Flex
              direction="column"
              css={{
                gap: 5,
              }}
            >
              <Flex
                justify="between"
              >
                <Text style="body3">Amount</Text>
                <Text style="body3">{`Balance: ${formatBN(nfteBalance?.result?.toString() || 0, 4, 18 || 10)}`}</Text>
              </Flex>
              <Box
                css={{
                  position: 'relative'
                }}
              >
                <NumericalInput
                  value={valueNFTE}
                  onUserInput={handleSetNFTEValue}
                  icon={<Button size="xs" onClick={() => handleSetMaxNFTEValue()}>MAX</Button>}
                  iconStyles={{
                    top: 4,
                    right: 4,
                    left: 'auto'
                  }}
                  containerCss={{
                    width: '100%'
                  }}
                  css={{
                    pl: 40,
                    pr: 80,
                    boxShadow: 'inset 0 0 0 2px'
                  }}
                />
                <CryptoCurrencyIcon
                  address={chain?.address || `0x0`}
                  chainId={arbitrum.id}
                  css={{
                    position: 'absolute',
                    width: 25,
                    height: 25,
                    top: 10,
                    left: 10
                  }}
                />
              </Box>
            </Flex>
            <Flex
              justify="between"
              css={{
                p: '14px 16px',
                backgroundColor: '$gray2',
                borderRadius: 8
              }}
            >
              <Text style="body2">Your Existing Balance</Text>
              <Flex
                align="center"
                css={{
                  gap: 5
                }}
              >
                <CryptoCurrencyIcon
                  address={chain?.LPNFTE as `0x${string}`}
                  chainId={chain?.id}
                  css={{
                    width: 20,
                    height: 20
                  }}
                />
                <Text style="body2">{`${formatBN(nfteLPbalance?.result || BigInt(0), 2, 18)} NFTE LP`}</Text>
              </Flex>
            </Flex>
            {/*<Flex*/}
            {/*  justify="between"*/}
            {/*  css={{*/}
            {/*    p: '14px 16px',*/}
            {/*    backgroundColor: '$gray2',*/}
            {/*    borderRadius: 8*/}
            {/*  }}*/}
            {/*>*/}
            {/*  <Text style="body2">Expected to receive</Text>*/}
            {/*  <Flex*/}
            {/*    align="center"*/}
            {/*    css={{*/}
            {/*      gap: 5*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <CryptoCurrencyIcon*/}
            {/*      address={chain?.LPNFTE as `0x${string}`}*/}
            {/*      chainId={chain?.id}*/}
            {/*      css={{*/}
            {/*        width: 20,*/}
            {/*        height: 20*/}
            {/*      }}*/}
            {/*    />*/}
            {/*    <Text style="body2">{`${valueNFTE}  NFTE LP`}</Text>*/}
            {/*  </Flex>*/}
            {/*</Flex>*/}
          </Flex>
          <Button
            disabled={disableButton}
            color="primary"
            size="large"
            css={{
              mt: 20,
              width: '100%',
              display: 'inline-block'
            }}
            onClick={handleAddLiquidity}
          >
            {buttonText}
          </Button>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default PoolPage