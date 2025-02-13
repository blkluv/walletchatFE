import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Link as CLink,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
} from '@chakra-ui/react'
import {
  IconCurrencyEthereum,
  IconExternalLink,
  IconShieldLock,
} from '@tabler/icons'
import { API } from 'react-wallet-chat/dist/src/types'
import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import equal from 'fast-deep-equal/es6'
import * as ENV from '@/constants/env'
import NFTGroupChat from '../../components/NFTGroupChat'
import NFTChat from '../../components/NFTChat'
import NFTTweets from '../../components/NFTTweets'
import { truncateAddress } from '../../../../helpers/truncateString'
import NFTStatisticsType from '../../../../types/NFTPort/NFTStatistics'
import NFTOwnerAddressType from '../../../../types/Alchemy/NFTOwnerAddressType'
import NFT from '../../../../types/NFT'
import OpenSeaNFT, {
  openseaToGeneralNFTType,
} from '../../../../types/OpenSea/NFT'
import AlchemyNFT, {
  alchemyToGeneralNFTType,
} from '../../../../types/Alchemy/NFT'
import IconPolygon from '../../../../images/icon-chains/icon-polygon.svg'
import IconEthereum from '../../../../images/icon-chains/icon-ethereum.svg'
import { capitalizeFirstLetter } from '../../../../helpers/text'
import { useHover } from '../../../../helpers/useHover'
import { getJwtForAccount } from '@/helpers/jwt'
import { useAppSelector } from '@/hooks/useSelector'
import { selectAccount } from '@/redux/reducers/account'
import { log } from '@/helpers/log'

const tokenType = 'erc721'

const NFTByContractAndId = () => {
  const account = useAppSelector((state) => selectAccount(state))

  const params = useParams()
  const { nftContractAddr = '', nftId = '', chain = '' } = params
  const [searchParams] = useSearchParams()

  const [tabIndex, setTabIndex] = useState<number>(params['*'] === 'dm' ? 2 : 0)
  const [nftData, setNftData] = useState<NFT>()
  const [nftStatistics, setNftStatistics] = useState<NFTStatisticsType>()

  const [joined, setJoined] = useState<boolean | null>(null)
  const [isFetchingJoining, setIsFetchingJoining] = useState(false)
  const [joinBtnIsHovering, joinBtnHoverProps] = useHover()

  const [ownerAddr, setOwnerAddr] = useState<string>()
  const recipientAddr =
    searchParams.get('recipient') === null
      ? ownerAddr
      : searchParams.get('recipient')

  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [tweetCount, setTweetCount] = useState<number>(0)

  useEffect(() => {
    window.addEventListener('message', (e) => {
      const { target, data }: API = e.data

      if (target === 'nft_info') {
        const {
          contractAddress,
          itemId,
          network,
          redirect,
          ownerAddress,
        }: any = data

        if (contractAddress && itemId && network && ownerAddress) {
          if (redirect) {
            setTabIndex(2)
          }
        }
      }
    })
  }, [])

  const getJoinStatus = () => {
    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/get_bookmarks/${account}/${nftContractAddr}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwtForAccount(account)}`,
        },
      }
    )
      .then((response) => response.json())
      .then((joined: boolean) => {
        log('✅[GET][NFT][Bookmarked?]')
        setJoined(joined)
      })
      .catch((error) => {
        console.error('🚨[POST][NFT][Bookmarked?]:', error)
      })
  }

  const joinGroup = () => {
    setIsFetchingJoining(true)
    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/create_bookmark`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwtForAccount(account)}`,
        },
        body: JSON.stringify({
          walletaddr: account,
          nftaddr: nftContractAddr,
        }),
      }
    )
      .then((response) => response.json())
      .then(() => {
        log('✅[POST][NFT][Join]')
        setJoined(true)
      })
      .finally(() => setIsFetchingJoining(false))
      .catch((error) => {
        console.error('🚨 [POST][NFT][Join]:', error)
      })
  }

  const leaveGroup = () => {
    setIsFetchingJoining(true)
    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/delete_bookmark`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwtForAccount(account)}`,
        },
        body: JSON.stringify({
          walletaddr: account,
          nftaddr: nftContractAddr,
        }),
      }
    )
      .then((response) => response.json())
      .then(() => {
        log('✅[POST][NFT][Leave]')
        setJoined(false)
      })
      .finally(() => setIsFetchingJoining(false))
      .catch((error) => {
        console.error('🚨[POST][NFT][Leave]:', error)
      })
  }

  const getTweetCount = () => {
    if (account) {
      fetch(
        ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/get_twitter_cnt/${nftContractAddr}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwtForAccount(account)}`,
          },
        }
      )
        .then((response) => response.json())
        .then((count: number) => {
          if (count !== tweetCount) {
            log('✅[GET][NFT][No. of tweets]:', count)
            setTweetCount(count)
          }
        })
        .catch((error) => {
          console.error('🚨[GET][NFT][No. of tweets]:', error)
        })
    }
  }

  const getUnreadDMCount = () => {
    if (account) {
      fetch(
        ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/get_unread_cnt/${account}/${nftContractAddr}/${nftId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwtForAccount(account)}`,
          },
        }
      )
        .then((response) => response.json())
        .then((count: number) => {
          if (count !== unreadCount) {
            log('✅[GET][NFT][No. of unread msgs]:', count)
            setUnreadCount(count)
          }
        })
        .catch((error) => {
          console.error('🚨[GET][NFT][No. of unread msgs]:', error)
        })
    }
  }

  const getNftMetadata = () => {
    if (!nftContractAddr) {
      log('Missing contract address')
      return
    }
    if (chain === 'ethereum') {
       // `https://api.opensea.io/api/v1/asset/${nftContractAddr}/${nftId}?account_address=${account}`,
        fetch(`${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/opensea_asset/${nftContractAddr}/${nftId}/${account}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${getJwtForAccount(account)}`,
          },
         })
        .then((response) => response.json())
        .then((result: OpenSeaNFT) => {
          if (result?.collection?.name && !equal(result, nftData)) {
            log(`✅[GET][NFT]:`, result)
            setNftData(openseaToGeneralNFTType(result))
          }
        })
        .catch((error) => log(`🚨[GET][NFT Contract]:`, error))
    } else if (chain === 'polygon') {
      if (ENV.REACT_APP_ALCHEMY_API_KEY_POLYGON === undefined) {
        log('Missing Alchemy API Key')
        return
      }
      fetch(
        `https://polygon-mainnet.g.alchemy.com/v2/${ENV.REACT_APP_ALCHEMY_API_KEY_POLYGON}/getNFTMetadata?contractAddress=${nftContractAddr}&tokenId=${nftId}`,
        {
          method: 'GET',
        }
      )
        .then((response) => response.json())
        .then((data: AlchemyNFT) => {
          log('✅[GET][NFT Metadata]:', data)
          setNftData(alchemyToGeneralNFTType(data))
        })
        .catch((error) => log('error', error))
    }
  }

  const getNftStatistics = () => {
    if (ENV.REACT_APP_NFTPORT_API_KEY === undefined) {
      log('Missing NFT Port API Key')
      return
    }
    if (!nftContractAddr) {
      log('Missing contract address')
      return
    }
    if (!chain) {
      log('Missing chain info')
      return
    }
    fetch(
      `https://api.nftport.xyz/v0/transactions/stats/${nftContractAddr}?chain=${chain}`,
      {
        method: 'GET',
        headers: {
          Authorization: ENV.REACT_APP_NFTPORT_API_KEY,
        },
      }
    )
      .then((response) => response.json())
      .then((result) => {
        if (
          result &&
          result.statistics &&
          !equal(result.statistics, nftStatistics)
        ) {
          log('✅[GET][NFT Statistics]:', result)
          setNftStatistics(result.statistics)
        }
      })
      .catch((error) => {
        log('error', error)
      })
  }

  const getOwnerAddress = () => {
    let alchemyUrl, key
    if (chain === 'ethereum') {
      alchemyUrl = 'https://eth-mainnet.g.alchemy.com/v2/'
      key = ENV.REACT_APP_ALCHEMY_API_KEY_ETHEREUM
    } else if (chain === 'polygon') {
      alchemyUrl = 'https://polygon-mainnet.g.alchemy.com/v2/'
      key = ENV.REACT_APP_ALCHEMY_API_KEY_POLYGON
    }

    if (alchemyUrl && key) {
      const baseURL = `${alchemyUrl}${key}/getOwnersForToken`
      const fetchURL = `${baseURL}?contractAddress=${nftContractAddr}&tokenId=${nftId}&tokenType=${tokenType}`

      fetch(fetchURL, {
        method: 'GET',
      })
        .then((response) => response.json())
        .then((result: NFTOwnerAddressType) => {
          log('✅[GET][NFT Owner Address]:', result)
          if (result?.owners && result?.owners[0]) {
            setOwnerAddr(result.owners[0])
          }
        })
        .catch((error) => log('error', error))
    }
  }

  useEffect(() => {
    getNftMetadata()
    getOwnerAddress()
    getNftStatistics()
    getJoinStatus()
  }, [nftContractAddr, nftId])

  useEffect(() => {
    const interval = setInterval(() => {
      getNftStatistics()
    }, 60000) // every 1 min

    return () => {
      clearInterval(interval)
    }
  }, [nftContractAddr, nftId, nftStatistics])

  useEffect(() => {
    getUnreadDMCount()
    getTweetCount()

    const interval = setInterval(() => {
      getUnreadDMCount()
      // getTweetCount()
    }, 5000) // every 5s

    return () => {
      clearInterval(interval)
    }
  }, [account, ownerAddr])

  return (
    <Flex flexDirection='column' background='white' flex='1'>
      <Flex alignItems='center' px={5} pt={4} pb={2}>
        <Flex alignItems='flex-start' p={2} borderRadius='md'>
          {nftData?.image && (
            <Image
              src={nftData.image}
              alt=''
              height='60px'
              borderRadius='var(--chakra-radii-xl)'
              mr={3}
            />
          )}
          <Box>
            {nftData?.name && <Heading size='md'>{nftData.name}</Heading>}
            <Flex alignItems='center'>
              {nftData?.name && (
                <CLink href={`/nft/ethereum/${nftContractAddr}`} mr={2}>
                  <Badge
                    d='flex'
                    alignItems='center'
                    textTransform='unset'
                    pl={0}
                  >
                    {nftData?.collection?.image && (
                      <Image
                        src={nftData.collection.image}
                        height='20px'
                        alt=''
                        mr={2}
                      />
                    )}
                    <Text fontSize='sm'>{nftData.collection?.name}</Text>
                  </Badge>
                </CLink>
              )}
              {nftStatistics && (
                <Tooltip
                  label={`${chain && capitalizeFirstLetter(chain)} chain`}
                >
                  <Badge d='flex' alignItems='center' mr={2} fontSize='sm'>
                    {chain === 'ethereum' && (
                      <Image
                        src={IconEthereum}
                        alt='Ethereum chain'
                        width='18px'
                        height='18px'
                        d='inline-block'
                        verticalAlign='middle'
                        p={0.5}
                      />
                    )}
                    {chain === 'polygon' && (
                      <Image
                        src={IconPolygon}
                        alt='Polygon chain'
                        width='18px'
                        height='18px'
                        d='inline-block'
                        verticalAlign='middle'
                        p={0.5}
                      />
                    )}
                  </Badge>
                </Tooltip>
              )}
              {nftStatistics && (
                <Tooltip label='Floor price'>
                  <Badge d='flex' alignItems='center' mr={2} fontSize='sm'>
                    {nftStatistics.floor_price < 0.01
                      ? '<0.01'
                      : nftStatistics.floor_price.toFixed(2)}
                    <IconCurrencyEthereum size='15' />
                  </Badge>
                </Tooltip>
              )}
              <Button
                ml={2}
                size='xs'
                variant={joined ? 'black' : 'outline'}
                isLoading={isFetchingJoining}
                onClick={() => {
                  if (joined === null) return
                  else if (joined === false) {
                    joinGroup()
                  } else if (joined === true) {
                    leaveGroup()
                  }
                }}
                // @ts-ignore
                {...joinBtnHoverProps}
              >
                <Text ml={1}>
                  {joinBtnIsHovering
                    ? joined
                      ? 'Leave?'
                      : '+ Join'
                    : joined
                    ? 'Joined'
                    : '+ Join'}
                </Text>
              </Button>
            </Flex>
            {ownerAddr && (
              <Box mb='1'>
                <Text fontSize='md' color='lightgray.800'>
                  Owned by {truncateAddress(ownerAddr)}{' '}
                  <Link
                    to={`https://etherscan.io/address/${ownerAddr}`}
                    target='_blank'
                    style={{
                      display: 'inline-block',
                      verticalAlign: 'middle',
                    }}
                  >
                    <IconExternalLink
                      size={16}
                      color='var(--chakra-colors-lightgray-900)'
                      stroke='1.5'
                    />
                  </Link>
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Flex>
      <Tabs
        display='flex'
        flexDirection='column'
        overflowY='auto'
        className='custom-scrollbar'
        flex='10 100px'
        variant='enclosed'
        isLazy
        index={tabIndex}
        onChange={setTabIndex}
      >
        <TabList padding='0 var(--chakra-space-5)'>
          <Tab>
            Chat{' '}
            {unreadCount && unreadCount !== 0 ? (
              <Badge variant='black' background='information.400' ml={1}>
                {unreadCount}
              </Badge>
            ) : (
              <></>
            )}
          </Tab>
          {tweetCount && tweetCount !== 0 ? (
            <Tab>
              Tweets{' '}
              {/* <Badge variant="black" background="information.400" ml={1}>
                        {tweetCount}
                     </Badge> */}
            </Tab>
          ) : (
            <></>
          )}
          <Tab>
            <Box textAlign='left'>
              <Text>DM Owner</Text>{' '}
              {unreadCount && unreadCount !== 0 ? (
                <Badge variant='black' ml={1}>
                  {unreadCount}
                </Badge>
              ) : (
                <></>
              )}
              <Box fontSize='xs' color='darkgray.100' d='flex'>
                <IconShieldLock size='15' />
                <Text ml={1}>Private</Text>
              </Box>
            </Box>
          </Tab>
        </TabList>

        <TabPanels overflowY='auto' className='custom-scrollbar' height='100%'>
          <TabPanel px='0' height='100%' padding='0'>
            <NFTGroupChat account={account} nftContractAddr={nftContractAddr} />
          </TabPanel>
          {tweetCount && tweetCount !== 0 && (
            <TabPanel p={5}>
              <NFTTweets account={account} nftContractAddr={nftContractAddr} />
            </TabPanel>
          )}
          <TabPanel px='0' height='100%' padding='0'>
            <NFTChat
              recipientAddr={recipientAddr}
              account={account}
              nftContractAddr={nftContractAddr}
              nftId={nftId}
            />
          </TabPanel>
          {/* <TabPanel p={5}>
                  <NFTComments
                     account={account}
                     nftContractAddr={nftContractAddr}
                     nftId={nftId}
                  />
               </TabPanel> */}
        </TabPanels>
      </Tabs>
    </Flex>
  )
}

export default NFTByContractAndId
