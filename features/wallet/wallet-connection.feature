Feature: MetaMask Wallet Connection
  As a DeFi user
  I want to connect my MetaMask wallet to the dApp
  So that I can interact with it using my on-chain identity

  @critical
  Scenario: Successfully connect MetaMask wallet
    Given I am on the DeFi application
    When I click the Connect Wallet button
    And I approve the connection in MetaMask
    Then I should see my wallet address displayed
    And the Connect button should change to Connected

  @high
  Scenario: Wallet connection persists across page navigation
    Given I have connected my MetaMask wallet
    When I navigate away and back to the application
    Then my connection should persist
    And I should see my wallet address displayed

  @medium
  Scenario: Switching accounts updates the connected address
    Given I have connected my MetaMask wallet
    When I add and switch to a new MetaMask account
    Then the displayed wallet address should update

  @high
  Scenario: Connecting while on an unsupported network surfaces a warning
    Given I am on the DeFi application
    And my MetaMask is on Ethereum mainnet
    When I click the Connect Wallet button
    Then I should see a wrong network error message
    And I should be prompted to switch to Sepolia testnet
