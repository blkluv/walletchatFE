import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Text,
  toast,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { IconX, IconSend } from '@tabler/icons'
import { useWallet } from '../../../../context/WalletProvider'
import * as ENV from '@/constants/env'
import { getJwtForAccount } from '@/helpers/jwt'
import { getCommunity } from '@/helpers/widget'
import { selectAccount } from '@/redux/reducers/account'
import { useAppSelector } from '@/hooks/useSelector'
import { log } from '@/helpers/log'

const EnterEmail = () => {
  const account = useAppSelector((state) => selectAccount(state))

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm()

  const navigate = useNavigate()
  const toast = useToast()

  const { setEmail: globalSetEmail } = useWallet()
  const { notifyDM: _notifyDM, setNotifyDM: globalSetNotifyDM } = useWallet()
  const { notify24: _notify24, setNotify24: globalSetNotify24 } = useWallet()
   const { setTelegramHandle } = useWallet()
  const dmBool = _notifyDM === 'true'
  const dailyBool = _notify24 === 'true'
  const [email, setEmail] = useState('')
   const [tgHandle, setTgHandle] = useState('')
  const [isFetching, setIsFetching] = useState(false)

  const handleChangeOne = (checked: boolean) => {
    //setCheckedItems([checked, checkedItems[1]])
    globalSetNotifyDM(checked.toString())

    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/update_settings`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwtForAccount(account)}`,
        },
        body: JSON.stringify({
          notifydm: checked.toString(),
          walletaddr: account,
        }),
      }
    )
      .then((response) => response.json())
      .then((response) => {
        log('✅[POST][NotifyDM]:', response)
        toast({
          title: 'Success',
          description: `Notifications updated!`,
          status: 'success',
          position: 'top',
          duration: 2000,
          isClosable: true,
        })
      })
      .catch((error) => {
        console.error('🚨[POST][NotifyDM]:', error)
      })
  }

  const handleChangeTwo = (checked: boolean) => {
    //setCheckedItems([checkedItems[0], checked])
    globalSetNotify24(checked.toString())

    fetch(
      ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/update_settings`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwtForAccount(account)}`,
        },
        body: JSON.stringify({
          notify24: checked.toString(),
          walletaddr: account,
        }),
      }
    )
      .then((response) => response.json())
      .then((response) => {
        log('✅[POST][Notify24]:', response)
        toast({
          title: 'Success',
          description: `Notifications updated!`,
          status: 'success',
          position: 'top',
          duration: 2000,
          isClosable: true,
        })
      })
      .catch((error) => {
        console.error('🚨[POST][Notify24]:', error)
      })
  }

  const handleCancel = () => {
    navigate(`/community/${getCommunity()}`)
  }

  const onSubmit = (values: any) => {
      if (values?.email || values?.telegramhandle) {
      setIsFetching(true)

      fetch(
        ` ${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/update_settings`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwtForAccount(account)}`,
          },
          body: JSON.stringify({
            email: values.email,
               telegramhandle: values.telegramhandle,
            walletaddr: account,
            notify24: _notify24,
            notifyDM: _notifyDM,
            signupsite: document.referrer,
            domain: document.domain,
          }),
        }
      )
        .then((response) => response.json())
        .then((response) => {
          log('✅[POST][Email]:', response)
          toast({
            title: 'Success',
            description: `Email updated to ${email}`,
            status: 'success',
            position: 'top',
            duration: 2000,
            isClosable: true,
          })
          if (values?.email) {
            globalSetEmail(values.email)
          }
          if (values?.telegramhandle) {
            setTelegramHandle(values.telegramhandle)
          }
          navigate('/me/verify-email')
        })
        .catch((error) => {
          console.error('🚨[POST][Email]:', error)
        })
        .then(() => {
          setIsFetching(false)
        })
    }
  }

  return (
    <Box p={6} pt={16} background='white' width='100%'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Text fontSize='3xl' fontWeight='bold' maxWidth='280px' mb={4}>
          Optional Notifications
          <br />
        </Text>
        <FormControl>
          <Stack pl={0} mt={6} spacing={2}>
            <Checkbox
              size='lg'
              isChecked={dmBool}
              onChange={(e) => handleChangeOne(e.target.checked)}
            >
              Receive an email for every incoming DM
            </Checkbox>
            <Checkbox
              size='lg'
              isChecked={dailyBool}
              onChange={(e) => handleChangeTwo(e.target.checked)}
            >
              Receive notifications summary email every 24 hours (DM, NFT,
              Community)
            </Checkbox>
          </Stack>
          <Divider
            orientation='horizontal'
            height='15px'
            d='inline-block'
            verticalAlign='middle'
          />
          <FormLabel fontSize='2xl'>
            Enter email/TG to receive notifications (optional)
          </FormLabel>
          <Flex>
            <Input
              type='text'
              size='lg'
              value={email}
              placeholder='somone@somewhere.com'
              borderColor='black'
              {...register('email', {
                        required: false,
              })}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
            </Flex>
            <Flex>
              <Input
                  type="text"
                  size="lg"
                  value={tgHandle}
                  placeholder="myFunTelegramHandle"
                  borderColor="black"
                  {...register('telegramhandle', {
                    required: false,
                  })}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTgHandle(e.target.value)
                  }
              />
            </Flex>
            <Flex>
              <Button
                variant='black'
                height='10'
                type='submit'
                isLoading={isFetching}
              >
                <IconSend size='20' />
              </Button>
              <Button
                variant='black'
                height='10'
                type='submit'
                onClick={handleCancel}
              >
                <IconX size="20" color="red"/>
              </Button>
          </Flex>
          <FormHelperText>
            You can change it anytime in your settings
          </FormHelperText>
          <Alert status='info' variant='solid' mt={4}>
            You must verify your email before you will receive notifications,
            please check your inbox
          </Alert>
          {errors.email && errors.email.type === 'required' && (
            <FormErrorMessage>No blank email please</FormErrorMessage>
          )}
        </FormControl>
      </form>
    </Box>
  )
}

export default EnterEmail
