import { Link } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  clarification_doc?: string | null;
  clarification?: string | null;
}

const ReqClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  clarification_doc,
  clarification,
}) => {
  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">View requested clarification</h4>
        <button
          className="close-btn bg-transparent border-0"
          onClick={handleClose}
        >
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        {clarification_doc && (
          <p className="sign-up-text mt-4">
            Clarification document:-{" "}
            <Link
              target="_blank"
              to={clarification_doc}
              className="fw-6"
            >
              {clarification_doc}
            </Link>
          </p>
        )}
        {clarification && (
          <p className="sign-up-text mt-4">
            Clarification:- {clarification}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ReqClarificationModal;
