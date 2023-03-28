import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import {
  Box,
  Flex,
  Image,
  Heading,
  Spinner,
  Tag,
  Button,
  Alert,
} from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { isMobile } from 'react-device-detect'
import * as PAGES from '@/constants/pages'
import logoThumb from './images/logo-thumb.svg'
import './App.scss'
import Inbox from './scenes/DM'
import NewConversation from './scenes/NewConversation'
import DMByAddress from './scenes/DM/scenes/DMByAddress'
import NFT from './scenes/NFT'
import Sidebar from './components/Sidebar/Sidebar'
import { useWallet } from './context/WalletProvider'
import useIsSmallLayout from '@/hooks/useIsSmallLayout'
import EnterName from './scenes/Me/scenes/EnterName'
import ChangeName from './scenes/Me/scenes/ChangeName'
import EnterEmail from './scenes/Me/scenes/EnterEmail'
import ChangeEmail from './scenes/Me/scenes/ChangeEmail'
import VerifyEmail from './scenes/Me/scenes/VerifyEmail'
import VerifySuccess from './scenes/Me/scenes/VerifySuccess'
import NFTByContractAndId from './scenes/NFT/scenes/NFTByContractAndId'
import Community from './scenes/Community'
import { isChromeExtension } from './helpers/chrome'
import NFTByContract from './scenes/NFT/scenes/NFTByContract'
import POAPById from './scenes/NFT/scenes/POAPById'
import CommunityByName from './scenes/Community/scenes/CommunityByName'
import ExtensionCloseButton from './components/ExtensionCloseButton'
import { getIsWidgetContext } from './utils/context'

const isWidget = getIsWidgetContext()

const CustomConnectButton = () => {
  const {
    siweFailed,
    siwePending,
    connectConfig,
    isAuthenticated,
    doRequestSiwe,
    connect,
  } = useWallet()

  // TODO: allow changing sign-in method after already selected wallet
  // switch wallet button
  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => {
        return (() => {
          if (siwePending || isAuthenticated === undefined) {
            return (
              <>
                <Spinner />

                <Alert status='success' variant='solid' mt={4}>
                  You must sign the pending message in your connected wallet
                </Alert>
              </>
            )
          }

          if (siweFailed || (isWidget && connectConfig)) {
            return (
              <Flex direction='column' gap={2} alignItems='start'>
                <Button
                  variant='black'
                  size='lg'
                  onClick={() =>
                    siweFailed ? doRequestSiwe() : connect(connectConfig)
                  }
                >
                  <Tag variant='solid' colorScheme='green' mr={2}>
                    Connected
                  </Tag>
                  <Box>Log in</Box>
                </Button>

                <Button variant='black' size='lg' onClick={openConnectModal}>
                  Sign in with another wallet
                </Button>

                {siweFailed && (
                  <Tag variant='solid' colorScheme='red'>
                    Signature failed or rejected, please try again
                  </Tag>
                )}
              </Flex>
            )
          }

          return <ConnectButton chainStatus='none' showBalance={false} />
        })()
      }}
    </ConnectButton.Custom>
  )
}

export const App = () => {
  const { isAuthenticated, name, account, web3, delegate }: any = useWallet()

  const isSmallLayout = useIsSmallLayout()

  if (!isAuthenticated) {
    return (
      <Flex flex={1} padding='15px'>
        <ExtensionCloseButton />

        <Box
          borderRadius='lg'
          className='bg-pattern'
          padding='70px 40px'
          flexGrow={1}
        >
          <Image src={logoThumb} mb={5} width='40px' />
          <Heading size='2xl' mb={8}>
            Login to start chatting
          </Heading>

          <CustomConnectButton />
        </Box>
      </Flex>
    )
  }

  if (isAuthenticated && !name) {
    return (
      <Box>
        <Flex
          flexDirection={isMobile && !isChromeExtension() ? 'column' : 'row'}
          minHeight={isSmallLayout ? '100vh' : 'unset'}
          width='100vw'
        >
          <ExtensionCloseButton />

          <Sidebar />

          {name === undefined ? (
            <Flex
              flexGrow={1}
              justifyContent='center'
              alignItems='center'
              width='100%'
            >
              <Spinner />
            </Flex>
          ) : (
            <EnterName account={account} />
          )}
        </Flex>
      </Box>
    )
  }

  return (
    <Box>
      <Flex
        flexDirection={isMobile && !isChromeExtension() ? 'column' : 'row'}
        minHeight={isSmallLayout ? '100vh' : 'unset'}
        width='100vw'
      >
        <ExtensionCloseButton />

        <Sidebar />

        <Flex
          flexGrow={1}
          overflow='hidden'
          minWidth='1px'
          flexDirection='column'
        >
          <Routes>
            <Route path={`/${PAGES.DM}`}>
              <Route
                path='new'
                element={
                  <Flex flexGrow={1}>
                    <NewConversation web3={web3} />
                    {!isSmallLayout && (
                      <Flex
                        background='lightgray.200'
                        flex='1'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Tag background='white'>
                          Select a chat to start messaging
                        </Tag>
                      </Flex>
                    )}
                  </Flex>
                }
              />

              <Route
                index
                element={
                  <Flex flexGrow={1}>
                    <Inbox account={account} web3={web3} />

                    {!isSmallLayout && (
                      <Flex
                        background='lightgray.200'
                        flex='1'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Tag background='white'>
                          Select a chat to start messaging
                        </Tag>
                      </Flex>
                    )}
                  </Flex>
                }
              />

              <Route
                path=':address'
                element={
                  <Flex flexGrow={1}>
                    {!isSmallLayout && <Inbox account={account} web3={web3} />}

                    <DMByAddress account={account} delegate={delegate} />
                  </Flex>
                }
              />
            </Route>

            <Route path={`/${PAGES.ME}`}>
              <Route
                path='enter-email'
                element={<EnterEmail account={account} />}
              />
              <Route path='change-name' element={<ChangeName />} />
              <Route
                path='change-email'
                element={<ChangeEmail account={account} />}
              />
              <Route
                path='verify-email'
                element={<VerifyEmail account={account} />}
              />
              <Route
                path='verify-success'
                element={<VerifySuccess account={account} />}
              />
            </Route>

            <Route
              path='/nft_error'
              element={
                <Flex flexGrow={1}>
                  <NFT account={account} web3={web3} />
                  {!isSmallLayout && (
                    <Flex
                      background='lightgray.200'
                      flex='1'
                      alignItems='center'
                      justifyContent='center'
                    >
                      <Tag background='white'>
                        You must own at least one NFT from the Searched
                        Collection
                      </Tag>
                    </Flex>
                  )}
                </Flex>
              }
            />

            <Route path={`/${PAGES.NFT}`}>
              <Route
                index
                element={
                  <Flex flexGrow={1}>
                    <NFT account={account} web3={web3} />

                    {!isSmallLayout && (
                      <Flex
                        background='lightgray.200'
                        flex='1'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Tag background='white'>Explore NFT groups</Tag>
                      </Flex>
                    )}
                  </Flex>
                }
              />

              <Route
                element={
                  <Flex flexGrow={1}>
                    {!isSmallLayout && <NFT account={account} web3={web3} />}

                    <Outlet />
                  </Flex>
                }
              >
                <Route
                  path='poap/:poapId'
                  element={<POAPById account={account} />}
                />

                <Route path=':chain'>
                  <Route path=':nftContractAddr'>
                    <Route
                      index
                      element={<NFTByContract account={account} />}
                    />
                    <Route
                      path=':nftId*'
                      element={<NFTByContractAndId account={account} />}
                    />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path={`/${PAGES.COMMUNITY}`}>
              <Route
                index
                element={
                  <Flex flexGrow={1}>
                    <Community account={account} web3={web3} />

                    {!isSmallLayout && (
                      <Flex
                        background='lightgray.200'
                        flex='1'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Tag background='white'>
                          Select a chat to start messaging
                        </Tag>
                      </Flex>
                    )}
                  </Flex>
                }
              />

              <Route
                path=':community'
                element={
                  <Flex flexGrow={1}>
                    {!isSmallLayout && (
                      <Community account={account} web3={web3} />
                    )}
                    <CommunityByName account={account} />
                  </Flex>
                }
              />
            </Route>

            <Route path='/' element={<Navigate to='/dm' replace />} />
            <Route path='/index.html' element={<Navigate to='/dm' replace />} />
          </Routes>
        </Flex>
      </Flex>
    </Box>
  )
}
