import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  reviewer_comment?: string | null;
}

const ViewCreatedClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  reviewer_comment
}) => {
  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Reviewer Clarification</h4>
        <button
          className="close-btn bg-transparent border-0"
          onClick={handleClose}
        >
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        {reviewer_comment && (
          <p className="sign-up-text mt-4">
            Reviewer Clarification Comment:- {reviewer_comment}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ViewCreatedClarificationModal;
