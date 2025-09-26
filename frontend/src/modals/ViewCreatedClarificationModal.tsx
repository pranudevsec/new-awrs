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
          <div className="mb-4">
            <h6 className="fw-6 mb-2">Reviewer Clarification Comment:</h6>
            <div 
              className="p-3 bg-light rounded border"
              style={{ 
                maxHeight: '300px',
                overflowY: 'auto',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {reviewer_comment}
              </p>
            </div>
          </div>
        )}
        {!reviewer_comment && (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No reviewer comment available</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewCreatedClarificationModal;
