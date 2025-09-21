Feature: Standup entries
  In order to see blockers quickly
  As a developer
  I want an endpoint that lists only entries with blockers

  Scenario: List blockers only
    Given I add a standup with blockers "DB down"
    And I add a standup with blockers "None"
    When I request the blockers list
    Then I should see exactly 1 entry with blockers "DB down"

    Scenario: Export all standups as CSV
    Given I add a standup with blockers "Network issue"
    When I request the standups export in CSV format
    Then I should see a CSV response containing "Network issue"

