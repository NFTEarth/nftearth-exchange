import { FC, useEffect, useRef } from 'react'
import { useMediaQuery } from 'react-responsive'
import {
  Text,
  Flex,
  TableCell,
  TableRow,
  HeaderRow,
  FormatCryptoCurrency,
  Anchor,
  Button,
} from '../primitives'
import Image from 'next/image'
import { useIntersectionObserver } from 'usehooks-ts'
import LoadingSpinner from '../common/LoadingSpinner'
import { useListings } from '@reservoir0x/reservoir-kit-ui'
import Link from 'next/link'
import { MutatorCallback } from 'swr'
import { useTimeSince } from 'hooks'
import CancelListing from 'components/buttons/CancelListing'
import { Address, useNetwork, useSigner } from 'wagmi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTag } from '@fortawesome/free-solid-svg-icons'

type Props = {
  address: Address | undefined
}

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID

const desktopTemplateColumns = '1.25fr .75fr repeat(3, 1fr)'

export const ListingsTable: FC<Props> = ({ address }) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const loadMoreObserver = useIntersectionObserver(loadMoreRef, {
    rootMargin: '0px 0px 300px 0px',
  })

  const {
    data: listings,
    mutate,
    fetchNextPage,
    isFetchingPage,
    isValidating,
  } = useListings({
    maker: address,
    includeCriteriaMetadata: true,
  })

  useEffect(() => {
    const isVisible = !!loadMoreObserver?.isIntersecting
    if (isVisible) {
      fetchNextPage()
    }
  }, [loadMoreObserver?.isIntersecting])

  return (
    <>
      {!isValidating && !isFetchingPage && listings && listings.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          css={{ py: '$6', gap: '$4', width: '100%' }}
        >
          <Text css={{ color: '$gray11' }}>
            <FontAwesomeIcon icon={faTag} size="2xl" />
          </Text>
          <Text css={{ color: '$gray11' }}>No listings yet</Text>
        </Flex>
      ) : (
        <Flex direction="column" css={{ width: '100%' }}>
          <TableHeading />
          {listings.map((listing, i) => {
            return (
              <ListingTableRow
                key={`${listing?.id}-${i}`}
                listing={listing}
                mutate={mutate}
              />
            )
          })}
          <div ref={loadMoreRef}></div>
        </Flex>
      )}
      {isValidating && (
        <Flex align="center" justify="center" css={{ py: '$6' }}>
          <LoadingSpinner />
        </Flex>
      )}
    </>
  )
}

type ListingTableRowProps = {
  listing: ReturnType<typeof useListings>['data'][0]
  mutate?: MutatorCallback
}

const ListingTableRow: FC<ListingTableRowProps> = ({ listing, mutate }) => {
  const isSmallDevice = useMediaQuery({ maxWidth: 900 })
  const expiration = useTimeSince(listing?.expiration)

  const { data: signer } = useSigner()
  const { chain: activeChain } = useNetwork()

  const isInTheWrongNetwork = Boolean(
    signer && CHAIN_ID && activeChain?.id !== +CHAIN_ID
  )

  let criteriaData = listing?.criteria?.data

  let imageSrc: string = (
    criteriaData?.token?.tokenId
      ? criteriaData?.token?.image || criteriaData?.collection?.image
      : criteriaData?.collection?.image
  ) as string

  if (isSmallDevice) {
    return (
      <Flex
        key={listing?.id}
        direction="column"
        align="start"
        css={{
          gap: '$3',
          borderBottom: '1px solid $gray3',
          py: '$3',
          width: '100%',
          overflow: 'hidden',
          flex: 1,
        }}
      >
        <Flex justify="between" css={{ width: '100%' }}>
          <Link href={`/${listing?.contract}/${criteriaData?.token?.tokenId}`}>
            <Flex align="center">
              {imageSrc && (
                <Image
                  style={{
                    borderRadius: '4px',
                    objectFit: 'cover',
                    aspectRatio: '1/1',
                  }}
                  loader={({ src }) => src}
                  src={imageSrc}
                  alt={`${listing?.id}`}
                  width={36}
                  height={36}
                />
              )}
              <Flex
                direction="column"
                css={{
                  ml: '$2',
                  overflow: 'hidden',
                  minWidth: 0,
                }}
              >
                <Text style="subtitle3" ellipsify css={{ color: '$gray11' }}>
                  {criteriaData?.collection?.name}
                </Text>
                <Text style="subtitle2" ellipsify>
                  #{criteriaData?.token?.tokenId}
                </Text>
              </Flex>
            </Flex>
          </Link>
          <FormatCryptoCurrency
            amount={listing?.price?.amount?.native}
            address={listing?.price?.currency?.contract}
            textStyle="subtitle2"
            logoHeight={14}
          />
        </Flex>
        <Flex justify="between" align="center" css={{ width: '100%' }}>
          <a href={`https://${listing?.source?.domain}`} target="_blank">
            <Flex align="center" css={{ gap: '$2' }}>
              <img
                width="20px"
                height="20px"
                src={(listing?.source?.icon as string) || ''}
                alt={`${listing?.source?.name}`}
              />
              <Text style="subtitle2">{expiration}</Text>
            </Flex>
          </a>
          <CancelListing
            listingId={listing?.id as string}
            mutate={mutate}
            trigger={
              <Button
                disabled={isInTheWrongNetwork}
                css={{ color: '$red11' }}
                color="gray3"
              >
                Cancel
              </Button>
            }
          />
        </Flex>
      </Flex>
    )
  }

  return (
    <TableRow
      key={listing?.id}
      css={{ gridTemplateColumns: desktopTemplateColumns }}
    >
      <TableCell css={{ minWidth: 0 }}>
        <Link href={`/${listing?.contract}/${criteriaData?.token?.tokenId}`}>
          <Flex align="center">
            {imageSrc && (
              <Image
                style={{
                  borderRadius: '4px',
                  objectFit: 'cover',
                  aspectRatio: '1/1',
                }}
                loader={({ src }) => src}
                src={imageSrc as string}
                alt={`${criteriaData?.token?.name}`}
                width={48}
                height={48}
              />
            )}
            <Flex
              direction="column"
              css={{
                ml: '$2',
                overflow: 'hidden',
              }}
            >
              <Text style="subtitle3" ellipsify css={{ color: '$gray11' }}>
                {criteriaData?.collection?.name}
              </Text>
              <Text style="subtitle2" ellipsify>
                #{criteriaData?.collection?.id}
              </Text>
            </Flex>
          </Flex>
        </Link>
      </TableCell>
      <TableCell>
        <FormatCryptoCurrency
          amount={listing?.price?.amount?.native}
          address={listing?.price?.currency?.contract}
          textStyle="subtitle2"
          logoHeight={14}
        />
      </TableCell>
      <TableCell>
        <Text style="subtitle2">{expiration}</Text>
      </TableCell>
      <TableCell>
        <Flex align="center" css={{ gap: '$2' }}>
          <img
            width="20px"
            height="20px"
            src={(listing?.source?.icon as string) || ''}
            alt={`${listing?.source?.name}`}
          />
          <Anchor
            href={`https://${listing?.source?.domain as string}`}
            target="_blank"
            color="primary"
            weight="normal"
          >
            {listing?.source?.name as string}
          </Anchor>
        </Flex>
      </TableCell>
      <TableCell>
        <Flex justify="end">
          <CancelListing
            listingId={listing?.id as string}
            mutate={mutate}
            trigger={
              <Button
                disabled={isInTheWrongNetwork}
                css={{ color: '$red11' }}
                color="gray3"
              >
                Cancel
              </Button>
            }
          />
        </Flex>
      </TableCell>
    </TableRow>
  )
}

const headings = ['Items', 'Listed Price', 'Expiration', 'Marketplace', '']

const TableHeading = () => (
  <HeaderRow
    css={{
      display: 'none',
      '@md': { display: 'grid' },
      gridTemplateColumns: desktopTemplateColumns,
    }}
  >
    {headings.map((heading) => (
      <TableCell>
        <Text style="subtitle3" subtleColor>
          {heading}
        </Text>
      </TableCell>
    ))}
  </HeaderRow>
)
