// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ExactDraft} from "../src/ExactDraft.sol";

interface Vm {
    function envUint(string calldata key) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// @notice Foundry deployment script for a test network selected by the caller's RPC.
contract Deploy {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (ExactDraft deployed) {
        uint256 expectedChainId = vm.envUint("EXACTDRAFT_DEPLOY_CHAIN_ID");
        require(expectedChainId == 968 || expectedChainId == 10143, "testnet chain ID required");
        require(block.chainid == expectedChainId, "RPC chain ID mismatch");
        uint256 deployerPrivateKey = vm.envUint("EXACTDRAFT_DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new ExactDraft();
        vm.stopBroadcast();
    }
}
