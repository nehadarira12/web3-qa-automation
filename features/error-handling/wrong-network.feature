Feature: Wrong Network Handling
  As a DeFi user
  I want to be warned when I'm on an unsupported network
  So that I don't attempt an action that will silently fail

  @high
  Scenario: Wrong network is detected on connection attempt
    Given I am on the DeFi application
    And my MetaMask is on Ethereum mainnet
    When I click the Connect Wallet button
    Then I should see a wrong network error message
    And I should be prompted to switch to Sepolia testnet

  @medium
  Scenario: Switching to Sepolia after a wrong-network warning clears it
    Given I am on the DeFi application
    And my MetaMask is on Ethereum mainnet
    When I click the Connect Wallet button
    Then I should see a wrong network error message
    When I switch MetaMask to the "sepolia" network
    And I approve the connection in MetaMask
    Then I should see my wallet address displayed

  @medium
  Scenario: Network connection drops mid-transaction
    Given I have connected my MetaMask wallet
    When the network connection drops mid-transaction
    Then I should see a network error message

  @medium
  Scenario: Expired MetaMask session requires reconnection
    Given I have connected my MetaMask wallet
    And my MetaMask session has expired
    When I attempt a wallet action requiring authorization
    Then I should be prompted to reconnect my wallet
