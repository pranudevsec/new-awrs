import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import { SVGICON } from "../constants/iconsList";

interface ReqSignatureApproveModalProps {
  show: boolean;
  handleClose: () => void;
  handleApprove: (signatureText: string) => void;
}

const ReqSignatureApproveModal: React.FC<ReqSignatureApproveModalProps> = ({
  show,
  handleClose,
  handleApprove,
}) => {
  const [signatureText, setSignatureText] = useState("");
  const [inputVisible, setInputVisible] = useState(false);

  const handleApproval = () => {
    if (!signatureText.trim()) {
      toast.error("Please enter a signature before approving.");
      return;
    }

    handleApprove(signatureText.trim());
  };

  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Enter Signature for Approval</h4>
        <button
          className="close-btn bg-transparent border-0"
          onClick={handleClose}
        >
          {SVGICON.app.close}
        </button>
      </div>

      <div className="modal-body bg-white rounded-3 pt-0 text-center">
        {!inputVisible ? (
          <button
            className="_btn primary mt-4"
            onClick={() => setInputVisible(true)}
          >
            Add Signature
          </button>
        ) : (
          <div className="mt-4 px-3">
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              className="form-control mb-3"
              placeholder="Enter your signature"
              autoComplete="off"
            />
          </div>
        )}

        {inputVisible && (
          <button className="_btn success mt-2" onClick={handleApproval}>
            Approve
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ReqSignatureApproveModal;
