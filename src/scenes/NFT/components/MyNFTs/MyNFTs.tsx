import { Box,Flex, Heading, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import equal from 'fast-deep-equal/es6'

import { convertIpfsUriToUrl } from '../../../../helpers/ipfs'
import MyNFTItem from './components/MyNFTItem'
import { NFTPortNFT } from '../../../../types/NFTPort/NFT'
import OpenSeaNFT, {
   openseaToGeneralNFTType,
} from '../../../../types/OpenSea/NFT'
import NFT from '../../../../types/NFT'
import { nftPortToGeneralNFTType } from '../../../../types/NFTPort/NFT'
import POAP from '../../../../types/POAP/POAP'
import MyNFTPOAP from './components/MyNFTPOAP'
import { chains } from '../../../../constants'
import ChainFilters from '../../../../components/ChainFilters'
import MyNFTSkeleton from './components/MyNFTSkeleton'
import * as ENV from '@/constants/env'
import { log } from '@/helpers/log'
import { getJwtForAccount } from '@/helpers/jwt'

export default function MyNFTs({ account }: { account: string }) {
   // NFTs
   const [nfts, setNfts] = useState<NFT[]>([])
   const [filteredNfts, setFilteredNfts] = useState<NFT[]>([])
   const [isFetchingNFTs, setIsFetchingNFTs] = useState(true)

   // POAPs
   const [poaps, setPoaps] = useState<POAP[]>([])
   const [filteredPoaps, setFilteredPoaps] = useState<POAP[]>([])
   const [isFetchingPOAPs, setIsFetchingPOAPs] = useState(true)

   // Filters
   const [chainFilters, setChainFilters] = useState<Array<string>>([''])

   useEffect(() => {
      const fetchAllNfts = async () => {
         if (ENV.REACT_APP_NFTPORT_API_KEY === undefined) {
            log('Missing NFTPort API Key')
            return
         }
         if (!account) {
            log('No account connected')
            return
         }

         if (!isFetchingNFTs) setIsFetchingNFTs(true)

         await Promise.all([
            fetch(
               `https://api.nftport.xyz/v0/accounts/${account}?chain=polygon`,
               {
                  method: 'GET',
                  headers: {
                     Authorization: ENV.REACT_APP_NFTPORT_API_KEY,
                  },
               }
            ).then((res) => res.json()),
            fetch(`${ENV.REACT_APP_REST_API}/${ENV.REACT_APP_API_VERSION}/opensea_asset_owner/${account}`, {
               method: 'GET',
               credentials: 'include',
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${getJwtForAccount(account)}`,
               },
              }).then((res) => res.json()),
         ])
            .then(([polygonData, ethereumData]) => {
               log(
                  `✅[GET][NFTs] ${account}:`,
                  polygonData,
                  ethereumData
               )
               let transformed: NFT[] = []
               if (polygonData?.nfts?.length > 0) {
                  transformed = polygonData.nfts
                     .filter((nft: NFTPortNFT) => nft.name || nft.file_url)
                     .map((nft: NFTPortNFT) => {
                        const _nft = nftPortToGeneralNFTType(nft)
                        return {
                           ..._nft,
                           chain_id: '137',
                           image: _nft?.image?.includes('ipfs://')
                              ? convertIpfsUriToUrl(_nft.image)
                              : _nft.image,
                        }
                     })
               }
               if (ethereumData?.assets?.length > 0) {
                  transformed = transformed.concat(
                     ethereumData.assets
                        .filter((nft: OpenSeaNFT) => nft.name || nft.image_url)
                        .map((nft: OpenSeaNFT) => {
                           const _nft = openseaToGeneralNFTType(nft)
                           return {
                              ..._nft,
                              chain_id: '1',
                           }
                        })
                  )
               }
               setNfts(transformed)
            })
            .finally(() => {
               setIsFetchingNFTs(false)
            })
            .catch((error) => log(`🚨[GET][NFTs] ${account}`, error))
            
      }
      const fetchPoaps = async () => {
         if (ENV.REACT_APP_POAP_API_KEY === undefined) {
            log('Missing POAP API Key')
            return
         }
         if (!account) {
            log('No account connected')
            return
         }

         setIsFetchingPOAPs(true)

         fetch(`https://api.poap.tech/actions/scan/${account}`, {
            method: 'GET',
            headers: {
               accept: 'application/json',
               'X-API-Key': ENV.REACT_APP_POAP_API_KEY,
             },
         })
            .then((response) => response.json())
            .then((result: POAP[]) => {
               log(`✅[GET][POAPs] ${account}:`, result)
               setPoaps(result)
            })
            .finally(() => {
               setIsFetchingPOAPs(false)
            })
            .catch((error) => log(error))
      }
      fetchAllNfts()
      fetchPoaps()
   }, [account])

   useEffect(() => {

      if (chainFilters.length === 0) {
         setNfts([])
      } else if (
         chainFilters.includes('') ||
         chainFilters.length === Object.keys(chains).length
      ) {
         if (!equal(nfts, filteredNfts)) setFilteredNfts(nfts)
         if (!equal(poaps, filteredPoaps)) setFilteredPoaps(poaps)
      } else if (chainFilters.length > 0) {
         const _newFilteredNfts = nfts.filter(
            (d) => d?.chain_id && chainFilters.includes(d.chain_id)
         )
         if (!equal(_newFilteredNfts, filteredNfts))
            setFilteredNfts(_newFilteredNfts)

         const _allowedChainNames = chainFilters.map((c) => chains[c]?.slug)

         const _newFilteredPoaps = poaps.filter(
            (d) => d?.chain && _allowedChainNames.includes(d.chain)
         )
         if (!equal(_newFilteredPoaps, filteredPoaps))
            setFilteredPoaps(_newFilteredPoaps)
      } else {
         setNfts([])
         setPoaps([])
      }
   }, [chainFilters, nfts, poaps])

   return (
      <Box
         overflowY="auto"
         className="custom-scrollbar"
      >
         <Box px={4} background="white">
            <Box mt={2}>
            <ChainFilters
               chainFilters={chainFilters}
               setChainFilters={setChainFilters}
            />
            </Box>
            <Flex wrap="wrap">
               {(isFetchingNFTs || isFetchingPOAPs) && (
                  <MyNFTSkeleton />
               )}
               {filteredPoaps.length === 0 && filteredNfts.length === 0 && !isFetchingNFTs && (
                  <Box textAlign="center" d="block" m="auto" p={5}>
                     <Text color="darkgray.100" fontSize="md">No NFTs found</Text>
                  </Box>
               )}
               {filteredPoaps.map((poap, i) => (
                  <Box mb={4} mr={4} key={i}>
                     <MyNFTPOAP key={i} poap={poap} />
                  </Box>
               ))}
               {filteredNfts.map((nft, i) => (
                  <Box mb={4} mr={4} key={i}>
                     <MyNFTItem key={i} nft={nft} />
                  </Box>
               ))}
            </Flex>
         </Box>
      </Box>
   )
}
