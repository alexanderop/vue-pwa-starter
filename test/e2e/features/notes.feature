Feature: Notes are local-first

  Data lives in IndexedDB on the device. A note captured offline has to
  survive the tab being closed, reloaded, or the network being gone.

  Scenario: A created note is still there after a reload
    Given I open the app
    When I add a note titled "Buy milk"
    Then I see a note titled "Buy milk"
    When I reload the app
    Then I see a note titled "Buy milk"
