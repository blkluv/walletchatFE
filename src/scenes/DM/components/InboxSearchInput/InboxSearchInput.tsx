import {
   Box,
   Button,
   Flex,
   FormControl,
   Input,
   Spinner,
   Text,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Blockies from 'react-blockies'
import { useWallet } from '../../../../context/WalletProvider'
import { truncateAddress } from '../../../../helpers/truncateString'
import useOnClickOutside from '../../../../hooks/useOnClickOutside'
import * as ENV from '@/constants/env'
import { log } from '@/helpers/log'

export default function InboxSearchInput() {
   const [toAddr, setToAddr] = useState<string>('')
   const [resolvedAddr, setResolvedAddr] = useState<string | null>()
   const [isResolvingENS, setIsResolvingENS] = useState(false)
   const [isSuggestionListOpen, setIsSuggestionListOpen] = useState(false)
   const { provider, web3 } = useWallet()

   const ref = useRef(null)

   const checkENS = async (address: string) => {
      if (address.includes(".eth") || address.includes(".bnb") || address.includes(".arb") || address.includes(".btc")) {
        setIsResolvingENS(true)
  
        fetch(`${ENV.REACT_APP_REST_API}/resolve_name/${address}`, {
           method: 'GET',
           credentials: "include",
           headers: {
              'Content-Type': 'application/json',
           },
        })
           .then((response) => response.json())
           .then((result) => {
              log(`✅[GET][Name Owned by ${address}]]:`, result)
              if (result?.address?.length > 0) {
                 setResolvedAddr(result.address)
                 setIsSuggestionListOpen(true)
              }
           })
           .catch((error) =>
              log(`🚨[GET][Owned by ${address}`, error)
           )
           .finally(() => {
              setIsResolvingENS(false)
           })
     }
    }

   useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
         checkENS(toAddr)
      }, 800)

      return () => clearTimeout(delayDebounceFn)
   }, [toAddr])

   const handleClickOutside = () => {
      if (isSuggestionListOpen === true) setIsSuggestionListOpen(false)
   }

   useOnClickOutside(ref, handleClickOutside)

   return (
      <Box position={'relative'} ref={ref}>
         <FormControl pos="relative">
            <Input
               type="text"
               value={toAddr}
               placeholder="Enter ENS/BNB/BTC/ARB or (0x...) to chat"
               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setToAddr(e.target.value)
               }
               onFocus={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (resolvedAddr) setIsSuggestionListOpen(true)
               }}
               background="lightgray.300"
            />
            {isResolvingENS && (
               <Box
                  pos="absolute"
                  right="1.5rem"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex="docked"
               >
                  <Spinner size="sm" />
               </Box>
            )}
         </FormControl>

         {  toAddr &&
            !isResolvingENS && (
               <Box
                  position="absolute"
                  top={'100%'}
                  left={0}
                  width="100%"
                  borderRadius="md"
                  p={2}
                  background="white"
                  borderColor="darkgray.100"
                  borderWidth="1px"
               >
                  <Text color="darkgray.500" fontSize="md" mb={1}>
                     Start chatting with
                  </Text>
                  {web3?.utils.isAddress(toAddr) && (
                     <Link 
                        to={`/dm/${toAddr}`} 
                        onClick={() => {
                           setIsSuggestionListOpen(false)
                           setToAddr('')
                        }}
                        style={{ textDecoration: 'none' }}>
                        <Flex
                        alignItems='center'
                        justifyContent='flex-start'
                        p={3}
                        background='lightgray.300'
                        borderRadius='md'
                        mt={2}
                        as={Button}
                        >
                        <Blockies seed={toAddr.toLocaleLowerCase()} scale={3} />
                        <Text fontWeight='bold' fontSize='md' ml={2}>
                           {truncateAddress(toAddr)}
                        </Text>
                        </Flex>
                     </Link>
                  )}
                  {(toAddr.includes('.eth') || toAddr.includes(".bnb") || toAddr.includes(".arb") || toAddr.includes(".btc")) && resolvedAddr && !isResolvingENS && (
                     <Link
                        to={`/dm/${resolvedAddr}`}
                        onClick={() => {
                           setIsSuggestionListOpen(false)
                           setToAddr('')
                        }}
                        style={{ textDecoration: 'none', width: '100%' }}
                     >
                        <Flex
                           alignItems="center"
                           justifyContent="flex-start"
                           p={3}
                           background="lightgray.300"
                           borderRadius="md"
                           as={Button}
                           width="100%"
                        >
                           <Blockies
                              seed={resolvedAddr.toLocaleLowerCase()}
                              scale={3}
                           />
                           <Text fontWeight="bold" fontSize="md" ml={2}>
                              {(toAddr.endsWith('.eth') || toAddr.endsWith('.bnb') || toAddr.endsWith('.arb') || toAddr.endsWith('.btc'))
                                 ? toAddr
                                 : truncateAddress(toAddr)}{' '}
                              {(toAddr.endsWith('.eth') || toAddr.endsWith('.bnb') || toAddr.endsWith('.arb') || toAddr.endsWith('.btc')) &&
                                 `(${truncateAddress(resolvedAddr)})`}
                           </Text>
                        </Flex>
                     </Link>
                  )}
               </Box>
            )}
      </Box>
   )
}
