import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import Blockies from 'react-blockies'
import { truncateAddress } from '../helpers/truncateString'
import { IconArrowRight } from '@tabler/icons'
import { useWallet } from '../context/WalletProvider'
import { addressIsValid } from '../helpers/address'
import * as ENV from '@/constants/env'
import { log } from '@/helpers/log'

const StartConversationWithAddress = () => {
  const [toAddr, setToAddr] = useState<string>('')
  const [resolvedAddr, setResolvedAddr] = useState<string | null>()
  const [isResolvingENS, setIsResolvingENS] = useState(false)
  const { provider, web3 } = useWallet()

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm()
  const navigate = useNavigate()

  const onSubmit = (values: any) => {
    navigate(`/dm/${toAddr}`)
  }

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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl mb={5}>
        <Heading size='md' mb={3}>
          Start a conversation with...
        </Heading>
        <Input
          type='text'
          value={toAddr}
          placeholder='Enter ENS/BNB/BTC/ARB or (0x...) to chat'
          {...register('toAddr', {
            validate: (val) => addressIsValid(web3, val),
          })}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setToAddr(e.target.value)
          }
        />
        {web3?.utils.isAddress(toAddr) && (
          <Link to={`/dm/${toAddr}`} style={{ textDecoration: 'none' }}>
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
        {isResolvingENS && <Spinner size='sm' mt={2} />}
        {(toAddr.includes('.eth') || toAddr.includes(".bnb") || toAddr.includes(".arb") || toAddr.includes(".btc")) && resolvedAddr && !isResolvingENS && (
          <Link to={`/dm/${resolvedAddr}`} style={{ textDecoration: 'none' }}>
            <Flex
              alignItems='center'
              justifyContent='flex-start'
              p={3}
              background='lightgray.300'
              borderRadius='md'
              mt={2}
              as={Button}
            >
              <Blockies seed={resolvedAddr.toLocaleLowerCase()} scale={3} />
              <Text fontWeight='bold' fontSize='md' ml={2}>
                {toAddr} ({truncateAddress(resolvedAddr)})
              </Text>
            </Flex>
          </Link>
        )}
        {errors?.toAddr && errors?.toAddr.type === 'validate' && (
          <FormErrorMessage>Address is not valid</FormErrorMessage>
        )}
      </FormControl>
      <Button variant='black' type='submit'>
        Start chat{' '}
        <Text ml={1}>
          <IconArrowRight size='16' />
        </Text>
      </Button>
    </form>
  )
}

export default StartConversationWithAddress
