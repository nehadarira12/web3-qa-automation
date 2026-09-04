Feature: Transaction Rejection
  As a DeFi user
  I want the dApp to handle a rejected transaction gracefully
  So that declining in MetaMask never leaves the app in a broken state

  @high
  Scenario: Reject a token transfer
    Given I have connected my MetaMask wallet
    When I initiate a transfer of "0.001" ETH to a test address
    And I reject the transaction in MetaMask
    Then I should see a transaction rejected message
    And my balance should remain unchanged

  @medium
  Scenario: Rejecting a transaction does not prevent a subsequent transfer
    Given I have connected my MetaMask wallet
    When I initiate a transfer of "0.001" ETH to a test address
    And I reject the transaction in MetaMask
    Then I should see a transaction rejected message
    When I initiate a transfer of "0.001" ETH to a test address
    And I approve the transaction in MetaMask
    Then I should see the transaction hash on screen
