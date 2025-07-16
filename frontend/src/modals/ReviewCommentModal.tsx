import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";

interface CommentData {
  comment: string;
  commented_by_role_type: string;
  commented_by_role: string;
  commented_at: string;
  commented_by: number;
}

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  reviewCommentsData?: CommentData | CommentData[];
}

const ReviewCommentModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  reviewCommentsData,
}) => {
  let comments: CommentData[] = [];

  if (Array.isArray(reviewCommentsData)) {
    comments = reviewCommentsData;
  } else if (reviewCommentsData) {
    comments = [reviewCommentsData];
  }

  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Review Comments</h4>
        <button
          className="close-btn bg-transparent border-0"
          onClick={handleClose}
        >
          {SVGICON.app.close}
        </button>
      </div>

      <div className="modal-body bg-white rounded-3 pt-0">
        {comments.length > 0 ? (
          comments.map((item) => (
            <div key={item.commented_at} className="mb-3 border-bottom pb-2">
              <p className="fw-semibold mb-1 text-uppercase">
                {item.commented_by_role_type}:
              </p>
              <p className="text-dark mb-1">{item.comment}</p>
              <p className="text-muted small mb-0">
                {new Date(item.commented_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted">No comments available.</p>
        )}
      </div>
    </Modal>
  );
};

export default ReviewCommentModal;
