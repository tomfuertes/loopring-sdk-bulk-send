// load env variables
require("dotenv").config();
const { Select, Confirm } = require("enquirer");
const sdk = require("@loopring-web/loopring-sdk");

const {
  INFURA_PROJECT_ID,
  ETH_ACCOUNT_PRIVATE_KEY,
  ETH_ACCOUNT_ADDRESS,
  CHAIN_ID,
  VERBOSE,
} = (function () {
  // eslint-disable-next-line no-undef
  const { env } = process;
  return {
    ...env,
    CHAIN_ID: parseInt(env.CHAIN_ID),
    VERBOSE: /^\s*(true|1|on)\s*$/i.test(env.VERBOSE),
  };
})();

const debug = (...args) => {
  if (VERBOSE) {
    console.log(...args);
  }
};

// LoopringAPI.userAPI = new sdk.UserAPI({ chainId });
// LoopringAPI.exchangeAPI = new sdk.ExchangeAPI({ chainId });
// LoopringAPI.globalAPI = new sdk.GlobalAPI({ chainId });
// LoopringAPI.ammpoolAPI = new sdk.AmmpoolAPI({ chainId });
// LoopringAPI.walletAPI = new sdk.WalletAPI({ chainId });
// LoopringAPI.wsAPI = new sdk.WsAPI({ chainId });
// LoopringAPI.nftAPI = new sdk.NFTAPI({ chainId });
// LoopringAPI.baseApi = new sdk.BaseAPI({ chainId });
// // LoopringAPI.blockAPI = new BlockAPI({ chainId });
// LoopringAPI.delegate = new sdk.DelegateAPI({ chainId });
// LoopringAPI.__chainId__ = chainId;
// // LoopringAPI.contractAPI = new sdk.ContractAPI;

// debug(Object.keys(sdk));

// initialize provider
const PrivateKeyProvider = require("truffle-privatekey-provider");
const Web3 = require("web3");
const provider = new PrivateKeyProvider(
  ETH_ACCOUNT_PRIVATE_KEY,
  `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`
);
const web3 = new Web3(provider);

const fs = require("fs");

const signatureKeyPairMock = async (accInfo, exchangeAddress) => {
  const keySeed =
    accInfo.keySeed ||
    sdk.GlobalAPI.KEY_MESSAGE.replace(
      "${exchangeAddress}",
      exchangeAddress
    ).replace("${nonce}", (accInfo.nonce - 1).toString());
  const eddsaKey = await sdk.generateKeyPair({
    web3,
    address: accInfo.owner,
    keySeed,
    walletType: sdk.ConnectorNames.Unknown,
    chainId: parseInt(CHAIN_ID, 10),
  });
  return eddsaKey;
};

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  try {
    // console.log({ CHAIN_ID });
    const exchangeAPI = new sdk.ExchangeAPI({ chainId: CHAIN_ID });
    const userAPI = new sdk.UserAPI({ chainId: CHAIN_ID });
    const walletAPI = new sdk.WalletAPI({ chainId: CHAIN_ID });
    const file = fs.readFileSync("./accounts.txt", "utf8");

    const accounts = [
      ...new Set(
        file
          // remove comments
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => !line.startsWith("#"))
          .join("\n")
          // split by spaces and remove empty lines
          .split(/\s+|,/)
          .filter(Boolean)
          // replace common characters
          .map((line) => line.replace(/['",]/gim, "").trim())
          // remove period from front or back of lines
          .map((line) => line.replace(/^\.|\.$/gim, "").trim())
          // filter only for lines remaining with .eth or 0x
          .filter((line) => line.endsWith(".eth") || line.startsWith("0x"))
      ),
    ];

    debug(accounts);

    // get info from chain / init of LoopringAPI contains process.env.CHAIN_ID
    const { exchangeInfo } = await exchangeAPI.getExchangeInfo();
    debug(exchangeInfo);
    // exchange address can change over time
    const { exchangeAddress } = exchangeInfo;
    debug("exchangeInfo", exchangeAddress);

    // Get the accountId and other metadata needed for sig
    debug("ETH_ACCOUNT_ADDRESS", ETH_ACCOUNT_ADDRESS);
    const { accInfo } = await exchangeAPI.getAccount({
      owner: ETH_ACCOUNT_ADDRESS,
    });
    debug("accInfo", accInfo);
    const { accountId } = accInfo;
    debug("accountId", accountId);

    // Auth to API via signature
    const eddsaKey = await signatureKeyPairMock(accInfo, exchangeAddress);
    const { apiKey } = await userAPI.getUserApiKey({ accountId }, eddsaKey.sk);
    if (/5/.test(CHAIN_ID)) {
      debug("auth:", { eddsaKey, apiKey });
    }

    const { userNFTBalances } = await userAPI.getUserNFTBalances(
      { accountId: accountId, limit: 20 },
      apiKey
    );
    debug("userNFTBalances:", userNFTBalances);

    const nftOptions = new Select({
      name: "color",
      message: "Pick an nft",
      choices: userNFTBalances.map((nft) => nft.nftId),
    });

    const selectedId = await nftOptions.run();
    debug("selectedId:", selectedId);

    const selected = userNFTBalances.find((nft) => nft.nftId === selectedId);

    debug("selected", selected);

    // get fees to make sure we can afford this
    const { fees } = await userAPI.getNFTOffchainFeeAmt(
      {
        accountId: accountId,
        requestType: sdk.OffchainNFTFeeReqType.NFT_TRANSFER,
        tokenAddress: selected.tokenAddress,
      },
      apiKey
    );
    debug("fees", fees);

    const USD_COST = parseInt((fees["USDC"] || fees["USDT"]).fee, 10) / 1e6;
    console.log(USD_COST);

    const feeOptions = new Select({
      name: "color",
      message: `Pick a fee option USD ~$${USD_COST}`,
      choices: Object.entries(fees)
        .filter(([k]) => /ETH|LRC/.test(k))
        .map(([k]) => k),
    });

    const selectedFeeKey = await feeOptions.run();
    debug("selectedFeeKey:", selectedFeeKey);
    const selectedFee = fees[selectedFeeKey];

    const goOn = new Confirm({
      name: "question",
      message: `Transfer to ${accounts.length} accounts? ${JSON.stringify(
        accounts
      )}`,
    });

    if (!(await goOn.run())) {
      throw new Error("User cancelled");
    }

    for (const input of accounts) {
      const account = input.endsWith(".eth")
        ? (
            await walletAPI.getAddressByENS({
              fullName: input,
            })
          ).address
        : input;

      if (!account) {
        console.error(`${input} ENS not found`);
        continue;
      }

      // get storage id for sending
      const { offchainId } = await userAPI.getNextStorageId(
        { accountId: accountId, sellTokenId: selected.tokenId },
        apiKey
      );

      // Might want to grab fees again jic but hasn't error for me yet AFAIK
      const opts = {
        request: {
          exchange: exchangeAddress,
          fromAccountId: accountId,
          fromAddress: ETH_ACCOUNT_ADDRESS,
          toAccountId: 0, // toAccountId is not required, input 0 as default
          toAddress: account,
          token: {
            tokenId: selected.tokenId,
            nftData: selected.nftData,
            amount: "1",
          },
          maxFee: {
            tokenId: selectedFee.tokenId,
            amount: selectedFee.fee,
          },
          storageId: offchainId,
          memo: `Sent w/ https://github.com/tomfuertes/loopring-sdk-bulk-send`,
          validUntil: Math.round(Date.now() / 1000) + 30 * 86400,
        },
        web3,
        chainId: parseInt(CHAIN_ID, 10),
        walletType: sdk.ConnectorNames.Unknown,
        eddsaKey: eddsaKey.sk,
        apiKey,
      };

      const transferResult = await userAPI.submitNFTInTransfer(opts);
      const { status, code, message } = transferResult;
      // debug("transferResult", transferResult);

      console.log("Transfer Result:", { account, status, code, message });
    }

    //
  } catch (error) {
    console.error(error);
  } finally {
    // eslint-disable-next-line no-undef
    process.exit(0);
  }
})();
