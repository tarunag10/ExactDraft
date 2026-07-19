// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ExactDraft
/// @notice Records two-wallet attestations that two local files have the same SHA-256 digest.
/// @dev The contract never receives file bytes. It stores only a bytes32 digest and agreement metadata.
contract ExactDraft {
    enum Status {
        Pending,
        Accepted,
        Cancelled,
        Expired
    }

    struct Agreement {
        address proposer;
        address counterparty;
        bytes32 fileHash;
        string reference;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 acceptedAt;
        Status status;
    }

    error AgreementNotFound();
    error EmptyFileHash();
    error InvalidCounterparty();
    error EmptyReference();
    error ReferenceTooLong();
    error ExpirationMustBeInFuture();
    error NotCounterparty();
    error NotProposer();
    error AgreementNotPending();
    error AgreementExpired();
    error HashMismatch();

    uint256 private constant MAX_REFERENCE_LENGTH = 140;
    Agreement[] private _agreements;

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed proposer,
        address indexed counterparty,
        bytes32 fileHash,
        string reference,
        uint64 createdAt,
        uint64 expiresAt
    );

    event AgreementAccepted(
        uint256 indexed agreementId,
        address indexed counterparty,
        bytes32 presentedHash,
        uint64 acceptedAt
    );

    event AgreementCancelled(
        uint256 indexed agreementId,
        address indexed proposer,
        uint64 cancelledAt
    );

    constructor() {
        // Agreement IDs are one-based so that the zero value can never be mistaken for a record.
        _agreements.push();
    }

    function createAgreement(
        bytes32 fileHash,
        address counterparty,
        string calldata reference,
        uint64 expiresAt
    ) external returns (uint256 agreementId) {
        if (fileHash == bytes32(0)) revert EmptyFileHash();
        if (counterparty == address(0) || counterparty == msg.sender) revert InvalidCounterparty();
        uint256 referenceLength = bytes(reference).length;
        if (referenceLength == 0) revert EmptyReference();
        if (referenceLength > MAX_REFERENCE_LENGTH) revert ReferenceTooLong();
        if (expiresAt <= block.timestamp) revert ExpirationMustBeInFuture();

        agreementId = _agreements.length;
        _agreements.push(
            Agreement({
                proposer: msg.sender,
                counterparty: counterparty,
                fileHash: fileHash,
                reference: reference,
                createdAt: uint64(block.timestamp),
                expiresAt: expiresAt,
                acceptedAt: 0,
                status: Status.Pending
            })
        );

        emit AgreementCreated(
            agreementId,
            msg.sender,
            counterparty,
            fileHash,
            reference,
            uint64(block.timestamp),
            expiresAt
        );
    }

    function acceptAgreement(uint256 agreementId, bytes32 presentedHash) external {
        Agreement storage agreement = _agreement(agreementId);
        if (msg.sender != agreement.counterparty) revert NotCounterparty();
        if (agreement.status != Status.Pending) revert AgreementNotPending();
        if (block.timestamp >= agreement.expiresAt) revert AgreementExpired();
        if (presentedHash != agreement.fileHash) revert HashMismatch();

        agreement.status = Status.Accepted;
        agreement.acceptedAt = uint64(block.timestamp);
        emit AgreementAccepted(agreementId, msg.sender, presentedHash, uint64(block.timestamp));
    }

    function cancelAgreement(uint256 agreementId) external {
        Agreement storage agreement = _agreement(agreementId);
        if (msg.sender != agreement.proposer) revert NotProposer();
        if (agreement.status != Status.Pending) revert AgreementNotPending();

        agreement.status = Status.Cancelled;
        emit AgreementCancelled(agreementId, msg.sender, uint64(block.timestamp));
    }

    function getAgreement(uint256 agreementId) external view returns (Agreement memory agreement) {
        agreement = _agreement(agreementId);
        if (agreement.status == Status.Pending && block.timestamp >= agreement.expiresAt) {
            agreement.status = Status.Expired;
        }
    }

    function agreementCount() external view returns (uint256) {
        return _agreements.length - 1;
    }

    function _agreement(uint256 agreementId) internal view returns (Agreement storage agreement) {
        if (agreementId == 0 || agreementId >= _agreements.length) revert AgreementNotFound();
        agreement = _agreements[agreementId];
    }
}
