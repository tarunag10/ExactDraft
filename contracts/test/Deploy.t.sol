// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Deploy} from "../script/Deploy.s.sol";

contract DeployTest {
    function testDeploymentChainGuardOnlyAllowsMatchingTestnets() public {
        Deploy deploy = new Deploy();
        require(deploy.isAllowedTestnet(968, 968), "BOT testnet should be allowed");
        require(deploy.isAllowedTestnet(10143, 10143), "Monad testnet should be allowed");
        require(!deploy.isAllowedTestnet(968, 10143), "mismatched RPC should fail");
        require(!deploy.isAllowedTestnet(677, 677), "mainnet should fail");
    }
}
