Feature: Token Transfer
  As a DeFi user
  I want to send an on-chain transaction
  So that I can move test funds through the dApp

  @critical
  Scenario: Successfully transfer tokens
    Given I have connected my MetaMask wallet
    And I have sufficient test ETH balance
    When I initiate a transfer of "0.001" ETH to a test address
    And I approve the transaction in MetaMask
    Then I should see the transaction hash on screen
    And my balance should be reduced by the transfer amount

  @high
  Scenario: Confirmed transaction hash is retained after a page reload
    Given I have connected my MetaMask wallet
    And I have sufficient test ETH balance
    When I initiate a transfer of "0.001" ETH to a test address
    And I approve the transaction in MetaMask
    Then I should see the transaction hash on screen
