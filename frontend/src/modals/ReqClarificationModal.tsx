import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";
import { baseURL } from "../reduxToolkit/helper/axios";

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
          <div className="mb-4">
            <h6 className="fw-6 mb-2">Clarification Document:</h6>
            <div className="p-3 bg-light rounded border">
              <a
                target="_blank"
                href={`${baseURL}/${clarification_doc}`}
                className="fw-6 text-primary text-decoration-none"
                style={{ 
                  wordBreak: 'break-all',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
              >
                {`${baseURL}/${clarification_doc}`}
              </a>
            </div>
          </div>
        )}
        {clarification && (
          <div className="mb-4">
            <h6 className="fw-6 mb-2">Clarification:</h6>
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
                {clarification}
              </p>
            </div>
          </div>
        )}
        {!clarification_doc && !clarification && (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No clarification content available</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReqClarificationModal;
