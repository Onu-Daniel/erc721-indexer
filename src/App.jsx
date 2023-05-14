import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import nft from '../component/nft.png'
// import Web3Modal from 'web3modal';

// create a Web3Provider instance using the user's browser window.ethereum
const provider = new ethers.providers.Web3Provider(window.ethereum);

// create a Signer instance using the provider instance
const signer = provider.getSigner();


function App() {
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [addressError, setAddressError] = useState("");

  async function getNFTsForOwner() {

    setIsLoading(true);
    setAddressError(""); // Clear any previous error message
   
 
    // check if the entered address is valid
    if (!ethers.utils.isAddress(userAddress)) {
      setIsLoading(false);
      setAddressError("Invalid address. Please enter a valid Ethereum address.");
      return;
    }
  
    // check if the entered address has a reverse resolution in ENS
    if (!await provider.resolveName(userAddress)) {
      setIsLoading(false);
      setAddressError("Invalid address. Please enter a valid Ethereum address or ENS name.");
      return;
    }

    const config = {
      apiKey: 'z7qfXKjkYzw3kivQJc1IdeMhtKXci2Kn',
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.nft.getNftsForOwner(userAddress);
    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsLoading(false);
  }

  async function connectWallet() {
    try {
      await window.ethereum.enable();
    } catch (e) {
      console.error(e);
    }
  }

  // use the useEffect hook to get the user's Ethereum address and set it as a state variable
 useEffect(() => {
  async function getAccounts() {
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      setUserAddress(accounts[0]);
    }
  }

  async function handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
      setUserAddress(accounts[0]);
    }
  }

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    getAccounts();
  }

  // Clean up the event listener when the component unmounts
  return () => {
    if (window.ethereum) {
      window.ethereum.off('accountsChanged', handleAccountsChanged);
    }
  };
}, []);




  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          value={userAddress}
          onChange={(e) => {
            setUserAddress(e.target.value);
            setAddressError("");
          }}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        {addressError && <Text color="red">{addressError}</Text>}
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          Fetch NFTs
        </Button>

        <Button fontSize={15} mt={36} bgColor="red" onClick={connectWallet}>
          Connect to a Wallet
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {isLoading ? (
          <div className="parentload">
            <div className="loader"></div>
          </div>
        ) : hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="#263A29"
                  w={'20vw'}
                  
                  style={{
                    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"
                  }}
                  key={e.id}
                >
                  <Box textAlign="center">
                    <b>Name:</b>{' '}
                    {tokenDataObjects[i].title?.length === 0
                      ? 'No Name'
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ??
                      'https://via.placeholder.com/200'
                    }
                    alt={'Image'}
                    onError={(e) => {
                      e.target.src = nft;
                    }}
                    height="300px"
                    width="270px"
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! The query may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
