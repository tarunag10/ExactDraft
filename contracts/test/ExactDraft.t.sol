// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ExactDraft} from "../src/ExactDraft.sol";

interface Vm {
    function prank(address sender) external;
    function warp(uint256 timestamp) external;
    function expectRevert(bytes calldata revertData) external;
}

contract ExactDraftTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    ExactDraft private exactDraft;

    address private proposer = address(0xA11CE);
    address private counterparty = address(0xB0B);
    bytes32 private fileHash = keccak256("local-file-sha256");

    function setUp() public {
        exactDraft = new ExactDraft();
        vm.warp(1_000_000);
    }

    function testCreateStoresOnlyAgreementMetadata() public {
        vm.prank(proposer);
        uint256 agreementId = exactDraft.createAgreement(fileHash, counterparty, "contract-v1", 1_001_000);

        require(agreementId == 1, "agreement id should be one-based");
        ExactDraft.Agreement memory agreement = exactDraft.getAgreement(agreementId);

        require(agreement.proposer == proposer, "proposer mismatch");
        require(agreement.counterparty == counterparty, "counterparty mismatch");
        require(agreement.fileHash == fileHash, "hash mismatch");
        require(keccak256(bytes(agreement.referenceText)) == keccak256(bytes("contract-v1")), "reference mismatch");
        require(agreement.createdAt == 1_000_000, "created timestamp mismatch");
        require(agreement.expiresAt == 1_001_000, "expiry mismatch");
        require(agreement.acceptedAt == 0, "accepted timestamp should be empty");
        require(agreement.status == ExactDraft.Status.Pending, "status should be pending");
    }

    function testOnlyCounterpartyCanAcceptAnExactHash() public {
        vm.prank(proposer);
        uint256 agreementId = exactDraft.createAgreement(fileHash, counterparty, "match", 1_001_000);

        vm.prank(proposer);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.NotCounterparty.selector));
        exactDraft.acceptAgreement(agreementId, fileHash);

        vm.prank(counterparty);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.HashMismatch.selector));
        exactDraft.acceptAgreement(agreementId, keccak256("different-local-file"));

        vm.prank(counterparty);
        exactDraft.acceptAgreement(agreementId, fileHash);

        ExactDraft.Agreement memory acceptedAgreement = exactDraft.getAgreement(agreementId);
        require(acceptedAgreement.acceptedAt == 1_000_000, "accepted timestamp mismatch");
        require(acceptedAgreement.status == ExactDraft.Status.Accepted, "status should be accepted");

        vm.prank(counterparty);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.AgreementNotPending.selector));
        exactDraft.acceptAgreement(agreementId, fileHash);
    }

    function testCancelledAndExpiredAgreementsCannotBeAccepted() public {
        vm.prank(proposer);
        uint256 cancelledId = exactDraft.createAgreement(fileHash, counterparty, "cancelled", 1_001_000);
        vm.prank(proposer);
        exactDraft.cancelAgreement(cancelledId);

        vm.prank(counterparty);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.AgreementNotPending.selector));
        exactDraft.acceptAgreement(cancelledId, fileHash);

        vm.prank(proposer);
        uint256 expiredId = exactDraft.createAgreement(fileHash, counterparty, "expired", 1_000_100);
        vm.warp(1_000_100);

        ExactDraft.Agreement memory expiredAgreement = exactDraft.getAgreement(expiredId);
        require(expiredAgreement.status == ExactDraft.Status.Expired, "status should be expired");

        vm.prank(counterparty);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.AgreementExpired.selector));
        exactDraft.acceptAgreement(expiredId, fileHash);
    }

    function testOnlyProposerCanCancelAndInvalidInputsRevert() public {
        vm.prank(proposer);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.EmptyFileHash.selector));
        exactDraft.createAgreement(bytes32(0), counterparty, "reference", 1_001_000);

        vm.prank(proposer);
        uint256 agreementId = exactDraft.createAgreement(fileHash, counterparty, "reference", 1_001_000);

        vm.prank(counterparty);
        vm.expectRevert(abi.encodeWithSelector(ExactDraft.NotProposer.selector));
        exactDraft.cancelAgreement(agreementId);

        vm.prank(proposer);
        exactDraft.cancelAgreement(agreementId);
    }
}
