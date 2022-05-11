import { Route, Routes, Navigate } from 'react-router-dom'
import { Button, Box, Flex, Image, Heading } from '@chakra-ui/react'

import logoThumb from './images/logo-thumb.svg'
import './App.scss'
import Inbox from './scenes/Inbox'
import NewConversation from './scenes/NewConversation'
import Chat from './scenes/Chat'
import Sidebar from './components/Sidebar'
import { useWallet } from './context/WalletProvider'
import { IconX } from '@tabler/icons'
import LoadingIndicator from './components/LoadingIndicator'

export const App = () => {
   const { appLoading, isAuthenticated, connectWallet, account, web3 } =
      useWallet()

   if (appLoading || !isAuthenticated) {
      return (
         <Flex
            p={2}
            flexFlow="column"
            position="absolute"
            top="15px"
            bottom="15px"
            left="10px"
            right="10px"
         >
            {/* <Header /> */}
            <Box textAlign="right" position="fixed" top={0} right={0}>
               <Button
                  borderBottomLeftRadius="lg"
                  borderBottomRightRadius="lg"
                  borderTopLeftRadius={0}
                  borderTopRightRadius={0}
                  background="lightGray.500"
                  py={0}
                  px={1}
                  size="lg"
                  height="30px"
               >
                  <IconX />
               </Button>
            </Box>
            <Box
               borderRadius="lg"
               className="bg-pattern"
               padding="70px 40px"
               flexGrow={1}
            >
               <Image src={logoThumb} mb={3} />
               {appLoading ? (
                  <LoadingIndicator />
               ) : (
                  <>
                     <Heading size="xl" mb={5}>
                        Login to start chatting
                     </Heading>
                     <Button
                        variant="black"
                        onClick={() => connectWallet()}
                        size="lg"
                     >
                        Sign in using wallet
                     </Button>
                  </>
               )}
            </Box>
         </Flex>
      )
   } else {
      return (
         <Box>
            <Flex>
               <Sidebar currAccountAddress={account} />
               <Box flex="1">
                  <Routes>
                     <Route path="/inbox" element={<Inbox web3={web3} />} />
                     <Route
                        path="/new"
                        element={<NewConversation web3={web3} />}
                     />
                     <Route
                        path="/chat/:address"
                        element={<Chat account={account} web3={web3} />}
                     />
                     <Route
                        path="/"
                        element={<Navigate to="/inbox" replace />}
                     />
                  </Routes>
               </Box>
            </Flex>
         </Box>
      )
   }
}
