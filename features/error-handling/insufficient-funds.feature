Feature: Insufficient Funds Handling
  As a DeFi user
  I want a clear error when I don't have enough funds
  So that I understand why my transaction can't go through

  @high
  Scenario: Transfer with insufficient funds
    Given I have connected my MetaMask wallet
    And I have insufficient ETH balance
    When I try to transfer more ETH than my balance
    Then I should see an insufficient funds error message
    And the transfer should not be initiated

  @medium
  Scenario: Session remains usable after an insufficient-funds rejection
    Given I have connected my MetaMask wallet
    And I have insufficient ETH balance
    When I try to transfer more ETH than my balance
    Then I should see an insufficient funds error message
    And the Connect button should change to Connected
