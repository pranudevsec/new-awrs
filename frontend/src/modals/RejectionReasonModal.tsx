import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";
import FormInput from "../components/form/FormInput";

interface RejectionReasonModalProps {
  show: boolean;
  handleClose: () => void;
  onSubmit: (reason: string) => void;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  show,
  handleClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason.trim());
    setReason("");
    handleClose();
  };

  return (
    <Modal centered show={show} onHide={handleClose} dialogClassName="clarification-modal">
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Rejection Reason</h4>
        <button className="close-btn bg-transparent border-0" onClick={handleClose}>
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <FormInput
              name="rejected_reason"
              placeholder="Enter reason for rejection..."
              type="text"
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e: any) => setReason(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RejectionReasonModal;
