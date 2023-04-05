import React from 'react'
import { Box, Flex, Spinner, Tag, Button, Alert } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getIsWidgetContext } from '@/utils/context'
import { useWallet } from '@/context/WalletProvider'

const isWidget = getIsWidgetContext()

const ConnectWalletButton = () => {
  const {
    siweLastFailure,
    siwePending,
    isAuthenticated,
    requestSIWEandFetchJWT,
    resetWidgetDataWithSignature,
    pendingConnect,
    clearWidgetData,
    previousWidgetData,
  } = useWallet()

  const canUseWidgetConnection = isWidget && previousWidgetData.current
  const siweFailed = Boolean(siweLastFailure)

  const hasPendingAuth = siwePending || isAuthenticated === undefined
  const [pending, setPending] = React.useState(hasPendingAuth)

  React.useEffect(() => {
    if (hasPendingAuth) {
      setPending(true)
    }
  }, [hasPendingAuth])

  React.useEffect(() => {
    if (siweLastFailure) {
      setPending(false)
    }
  }, [siweLastFailure])

  const handleLogin = async () => {
    setPending(true)
    pendingConnect.current = true

    resetWidgetDataWithSignature()
  }

  // TODO: allow changing sign-in method after already selected wallet
  // switch wallet button
  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => {
        return (() => {
          if (hasPendingAuth) {
            return (
              <>
                <Spinner />

                {hasPendingAuth && (
                  <Alert status='success' variant='solid' mt={4}>
                    You must sign the pending message in your connected wallet
                  </Alert>
                )}
              </>
            )
          }

          return (
            <Flex direction='column' gap={2} alignItems='start'>
              {canUseWidgetConnection ? (
                <Button variant='black' size='lg' onClick={handleLogin}>
                  <Tag variant='solid' colorScheme='green' mr={2}>
                    Connected
                  </Tag>
                  <Box>Use the App to Log in</Box>
                </Button>
              ) : (
                <Button
                  variant='black'
                  size='lg'
                  onClick={
                    siweFailed ? requestSIWEandFetchJWT : openConnectModal
                  }
                >
                  {siweFailed ? 'Retry signature' : 'Sign in using wallet'}
                </Button>
              )}

              {(siweFailed || canUseWidgetConnection) && (
                <Button
                  variant='black'
                  size='lg'
                  onClick={() => {
                    if (canUseWidgetConnection) clearWidgetData()
                    openConnectModal()
                  }}
                >
                  Sign in with another wallet
                </Button>
              )}

              {siweFailed && (
                <Tag variant='solid' colorScheme='red'>
                  Signature failed or rejected, please try again
                </Tag>
              )}
            </Flex>
          )
        })()
      }}
    </ConnectButton.Custom>
  )
}

export default ConnectWalletButton
