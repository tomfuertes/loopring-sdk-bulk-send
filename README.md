# loopring-sdk-bulk-send

Bulk send NFTs w/ prompts

![ezgif-1-533c892cb3](https://user-images.githubusercontent.com/1503991/172061707-2daa037c-f105-45cb-bc54-add4b0478e5d.gif)

## Installation, Config, and Running

Requires a free https://infura.io/ account.

```
# Clone the repo
git clone https://github.com/tomfuertes/loopring-sdk-bulk-send.git;

# cd into it and install dependencies
cd loopring-sdk-bulk-send;
npm install;

# create an env file
cp .env.example .env

### DISCLAIMER ###
# L2 accounts are "cheap" to create. I'd suggest creating a new one to 
# do your bulk sending from since this process requires you copy your private
# key out of your wallet / metamask / etc...
# Loose steps to do so: 
# - a) create a new MetaMask/Gamestop Wallet Account
# - b) Transfer $50 to that account on L2 + Pay the activation fee
# - c) Mint from your primary account / transfer all to your bulk account
# - d) Run the program on your bulk account in case you accidentally expose your keys once copied out

# TODO: Edit .env with your private key, eth address, and infura project

# TODO: Edit ./accounts.txt with accounts you want to send to

node bulk-send.js
```

`node bulk-send.js` will prompt the following questions:

- `Pick an nft: [Array of IDs from your account]` - Select the NFT ID from the view page on explorer corresponding to the NFT you want to send

- `Pick a fee option USD $X.XX` - Select ETH or LRC to pay your fees. Estimated cost per send displayed in USDC.

- `Transfer to Y accounts: [list of accounts]` - Defaults to `N` for no if you hit enter. Type `y<enter>` to run. Helpful if you selected a wrong fee or NFT or it is too high.

## FAQ

* Only tested w/ a Metamask / Gamestop wallet Private Key
* "IsMobile any Navigator is undefined" is a message from the Loopring SDK running on node / not an issue.
* `status: processing` means success as far as I can tell
* if `code: undefined` or `message: undefined` do not show and instead show something else, it's likely an error and did not send
* The `Select NFT by ID` question can be found at the top of an explorer page (e.g., `0x32f006a901505c8c015714cc4390f7f5447c1b07983b050c9cd92da90777584c` for [this NFT](https://explorer.loopring.io/nft/0xb6a1df588d2cb521030a5269d42a9c34f1ecaeab-0-0x92f7c57650b6dae91b8a8d73b1fb90f70b39358e-0x32f006a901505c8c015714cc4390f7f5447c1b07983b050c9cd92da90777584c-10))

Code is provided as is. No direct help offered here or in DM if npm / node errors aren't approachable for you. Happy to link to resources that are more step by step as they're created.

## Contributions

Hope that all helps! PRs are welcome. Spoonfeeding code help won't happen here but feel free to file issues / use discord as needed

💙 -Tom
