Feature: Network Switching
  As a DeFi user
  I want to switch networks in MetaMask
  So that I can interact with the dApp on the correct chain

  @critical
  Scenario: Switch from Ethereum mainnet to Sepolia testnet
    Given I have connected my MetaMask wallet
    When I switch MetaMask to the "mainnet" network
    And I switch MetaMask to the "sepolia" network
    Then the network badge should show "sepolia"

  @high
  Scenario: dApp detects and reports connection while on the wrong network
    Given I am on the DeFi application
    And my MetaMask is on Ethereum mainnet
    When I click the Connect Wallet button
    Then I should see a wrong network error message

  @medium
  Scenario: Network badge updates immediately after a switch
    Given I have connected my MetaMask wallet
    When I switch MetaMask to the "mainnet" network
    Then the network badge should show "mainnet"
