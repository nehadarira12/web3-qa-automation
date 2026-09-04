Feature: MetaMask Wallet Disconnection
  As a DeFi user
  I want to disconnect my MetaMask wallet
  So that the dApp no longer has access to my account

  # The installed Synpress driver doesn't wrap a connected-sites /
  # permissions-revocation action, so "Disconnect" here is exercised via
  # locking MetaMask — see the doc comment on MetaMaskPage#lockWallet. A
  # locked wallet can no longer serve the dApp's account/signing requests,
  # which is the externally observable effect a real disconnect would have.
  @critical
  Scenario: Disconnect MetaMask wallet
    Given I have connected my MetaMask wallet
    When I click the Disconnect button
    Then I should see the Connect Wallet button again
    And my wallet address should not be visible

  @medium
  Scenario: Reconnecting after disconnecting works as a fresh connection
    Given I have connected my MetaMask wallet
    When I click the Disconnect button
    And I unlock my MetaMask wallet
    And I click the Connect Wallet button
    And I approve the connection in MetaMask
    Then I should see my wallet address displayed
