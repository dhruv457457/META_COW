import assert from "assert";
import { 
  TestHelpers,
  ERC1967Proxy_Upgraded
} from "generated";
const { MockDb, ERC1967Proxy } = TestHelpers;

describe("ERC1967Proxy contract Upgraded event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ERC1967Proxy contract Upgraded event
  const event = ERC1967Proxy.Upgraded.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ERC1967Proxy_Upgraded is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ERC1967Proxy.Upgraded.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualERC1967ProxyUpgraded = mockDbUpdated.entities.ERC1967Proxy_Upgraded.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedERC1967ProxyUpgraded: ERC1967Proxy_Upgraded = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      implementation: event.params.implementation,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualERC1967ProxyUpgraded, expectedERC1967ProxyUpgraded, "Actual ERC1967ProxyUpgraded should be the same as the expectedERC1967ProxyUpgraded");
  });
});
