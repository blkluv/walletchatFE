import * as wagmi from '@wagmi/core'

import React, { useState } from 'react'
import Web3 from 'web3'
import { SiweMessage } from 'siwe'

import storage from '../utils/extension-storage'
import Lit from '../utils/lit'
import * as ENV from '@/constants/env'

export const WalletContext = React.createContext<any>(null)
export const useWallet = () => React.useContext(WalletContext)

/* eslint-disable react/display-name */
const WalletProvider = React.memo(({ children }: { children: any }) => {
  const didWelcome = React.useRef(false)
  const signedIn = React.useRef(Boolean(storage.get('jwt')))

  const provider = wagmi.getProvider()
  const network = wagmi.getNetwork()

  const [account, setAccount] = React.useState(wagmi.getAccount())
  const [accountAddress, setAccountAddress] = React.useState(
    account && account.address
  )
  const [nonce, setNonce] = React.useState<string | null>()
  const [name, setName] = useState<string | undefined | null>(undefined)
  const [email, setEmail] = useState(null)
  const [notifyDM, setNotifyDM] = useState('true')
  const [notify24, setNotify24] = useState('true')
  const [isAuthenticated, setAuthenticated] = useState(signedIn.current)
  const [delegate, setDelegate] = useState<null | string>(null)

  wagmi.watchAccount((wagmiAccount) => setAccount(wagmiAccount))

  const getName = (address: string) => {
    if (name) return

    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/name/${address}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('✅[GET][Name]:', data)

        if (data[0]?.name) {
          setName(data[0].name)
        } else {
          setName(null)
        }
      })
      .catch((error: any) => {
        console.error('🚨[GET][Name]:', error)
        setName(null)
      })
  }

  const getSettings = (address: string) => {
    if (email) return

    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/get_settings/${address}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('✅[GET][Settings]:', data)
        if (data[0]?.email) {
          console.log('-[Email]:', data[0].email)
          setEmail(data[0].email)
        }
        if (data[0]?.notifydm) {
          console.log('-[notifydm]:', data[0].notifydm)
          setNotifyDM(data[0].notifydm)
        }
        if (data[0]?.notify24) {
          console.log('-[notify24]:', data[0].notify24)
          setNotify24(data[0].notify24)
        }
      })
      .catch((error: any) => {
        console.error('🚨[GET][Setting]:', error)
      })
  }

  function parseJwt(token: string) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  function getNonce(address: string) {
    fetch(` ${ENV.REACT_APP_REST_API}/users/${address}/nonce`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then(async (usersData: any) => {
        console.log('✅[GET][Nonce]:', usersData)
        setNonce(usersData.Nonce)
      })
      .catch((error) => {
        console.error('🚨[GET][Nonce]:', error)
      })
  }

  React.useEffect(() => {
    const address = account && account.address
    if (address) {
      setAccountAddress(address)

      if (didWelcome.current) return

      didWelcome.current = true

      fetch(` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/welcome`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      })
        .then((response) => response.json())
        .then(async (welcomeData) => {
          console.log('✅[POST][Welcome]:', welcomeData.msg)

          if (!welcomeData.msg.includes(address.toLocaleLowerCase())) {
            getNonce(address)
          } else {
            const newName = welcomeData.msg.toString().split(':')[1]
            setName(newName)
            console.log('✅[Name]:', newName)
          }
        })
        .catch((welcomeError) => {
          console.error('🚨[POST][Welcome]:', welcomeError)
          getNonce(address)
        })
    }
  }, [account])

  React.useEffect(() => {
    if (accountAddress && nonce && network && network.chain) {
      const doSignIn = async () => {
        if (signedIn.current) return

        const domain = 'walletchat.fun'
        const origin = 'https://walletchat.fun'
        const statement =
          'You are signing a plain-text message to prove you own this wallet address. No gas fees or transactions will occur.'

        const siweMessage = new SiweMessage({
          domain,
          address: accountAddress,
          statement,
          uri: origin,
          version: '1',
          chainId: network.chain?.id,
          nonce,
        })

        const messageToSign = siweMessage.prepareMessage()
        const signer = await wagmi.fetchSigner()
        const signature = await signer?.signMessage(messageToSign)

        const authSig = {
          sig: signature,
          derivedVia: 'web3.eth.personal.sign',
          signedMessage: messageToSign,
          address: accountAddress.toLocaleLowerCase(),
        }

        console.log('✅[INFO][AuthSig]:', authSig)

        fetch(`${ENV.REACT_APP_REST_API}/signin`, {
          body: JSON.stringify({
            name: network.chain?.id.toString(),
            address: accountAddress,
            nonce,
            msg: messageToSign,
            sig: signature,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
          .then((response) => response.json())
          .then(async (signInData) => {
            localStorage.setItem('jwt', signInData.access)
            localStorage.setItem('lit-auth-signature', JSON.stringify(authSig))
            Lit.connectManual()
            console.log('✅[INFO][JWT]:', signInData.access)
            // if we log in with a full delegate, act as the vault
            const walletInJWT = parseJwt(signInData.access).sub
            if (
              walletInJWT.toLocaleLowerCase() !==
              accountAddress.toLocaleLowerCase()
            ) {
              console.log(
                '✅[Using Full Delegate Wallet]:',
                walletInJWT,
                accountAddress
              )
              setDelegate(accountAddress) // not sure this is used anymore
              setAccountAddress(walletInJWT)
            }

            getName(accountAddress)
            getSettings(accountAddress)
          })

        signedIn.current = true
        setAuthenticated(true)
      }

      doSignIn()
    }
  }, [accountAddress, network, nonce, provider])

  const disconnectWallet = async () => {
    wagmi.disconnect()

    const rkRecent = localStorage.getItem('rk-recent')
    localStorage.clear()
    if (rkRecent) localStorage.setItem('rk-recent', rkRecent)

    didWelcome.current = false
    signedIn.current = false
    setNonce(null)
    setAuthenticated(false)
  }

  const contextValue = React.useMemo(
    () => ({
      name,
      email,
      notifyDM,
      notify24,
      setName,
      setEmail,
      setNotifyDM,
      setNotify24,
      account: accountAddress?.toLowerCase(),
      disconnectWallet,
      isAuthenticated,
      web3: provider && new Web3(provider),
      provider,
      delegate,
    }),
    [
      accountAddress,
      delegate,
      email,
      isAuthenticated,
      name,
      notify24,
      notifyDM,
      provider,
    ]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
})

export default WalletProvider
