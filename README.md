# loopring-sdk-bulk-send

Bulk send NFTs w/ prompts

![image](https://user-images.githubusercontent.com/1503991/172061695-140f7de4-4d42-4a45-b0b8-7f44843960dd.png)

## First Time

```
# Clone the repo
git clone https://github.com/tomfuertes/loopring-sdk-bulk-send.git;

# cd into it and install dependencies
cd loopring-sdk-bulk-send;
npm install;

# create an env file
cp .env.example .env

# edit .env with your private key, eth address, and infura project
```

# To Bulk Send

Once you've done the "First Time" above:

1. `cd loopring-sdk-bulk-send`
2. Paste your accounts to send to in accounts.txt (ideally one per line but there's some automagical helper functions that might let you ctrl+a,ctrl+v whole twitter threads / reddit comment pages and it'll just work)
3. `node bulk-send.js` will walk you through the following options:

- `Pick an nft: [Array of IDs from your account]` - Select the NFT ID from the view page on explorer corresponding to the NFT you want to send

- `Pick a fee option USD $X.XX` - Select ETH or LRC to pay your fees. Estimated cost displayed in USDC.

- `Transfer to Y accounts: [list of accounts]` - Defaults to `N` for no if you hit enter. Type `y<enter>` to run. Helpful if you selected a wrong fee or NFT or it is too high.

Hope that all helps! PRs are welcome. Spoonfeeding code help won't happen here but feel free to file issues / use discord as needed

💙 -Tom
