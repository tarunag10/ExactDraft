// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ExactDraft} from "../src/ExactDraft.sol";

interface Vm {
    function envUint(string calldata key) external returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// @notice Foundry deployment script for Monad testnet.
contract Deploy {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (ExactDraft deployed) {
        uint256 deployerPrivateKey = vm.envUint("MONAD_TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new ExactDraft();
        vm.stopBroadcast();
    }
}
