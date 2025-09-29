import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";
import { baseURL } from "../reduxToolkit/helper/axios";
import { downloadDocumentWithWatermark } from "../utils/documentUtils";
import toast from "react-hot-toast";

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
  // Function to handle document download with watermark
  const handleDocumentDownload = async (documentUrl: any, fileName: string) => {
    try {
      await downloadDocumentWithWatermark(documentUrl, fileName, baseURL);
      toast.success('Document downloaded with watermark');
    } catch (error) {      
      // Show more specific error message for missing files
      if (error instanceof Error && error.message.includes('Document not found')) {
        toast.error(`File not found: ${fileName}. The file may have been deleted or moved.`);
      } else {
        toast.error('Failed to load document');
      }
    }
  };

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
              <button
                onClick={() => handleDocumentDownload(clarification_doc, clarification_doc.split("/").pop() || "document")}
                className="fw-6 text-primary text-decoration-none"
                style={{ 
                  wordBreak: 'break-all',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left"
                }}
              >
                {`${baseURL}/${clarification_doc}`}
              </button>
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
