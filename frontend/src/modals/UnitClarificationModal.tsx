import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";
import { createClarification } from "../reduxToolkit/services/clarification/clarificationService";
import { useAppDispatch } from "../reduxToolkit/hooks";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  type: string;
  application_id: number;
  parameter_name: string;
  parameter_id: string;
  isRefreshData: boolean;
  setIsRefreshData: React.Dispatch<React.SetStateAction<boolean>>;
}

const UnitClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  type,
  application_id,
  parameter_name,
  parameter_id,
  setIsRefreshData,
  isRefreshData
}) => {
  const dispatch = useAppDispatch();

  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      type,
      application_id,
      parameter_name,
      parameter_id,
      reviewer_comment: comment,
    };

    try {
      await dispatch(createClarification(payload)).unwrap();
      setIsRefreshData(!isRefreshData);
      handleClose();
      setComment("");
    } catch (err) {
      console.error("Clarification creation failed", err);
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
        <h4 className="font-lexend fw-6">Create Reviewer's Comment</h4>
        <button className="close-btn bg-transparent border-0" onClick={handleClose}>
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <FormInput
              name="reviewer_comment"
              placeholder="Maximum 200 Words..."
              type="text"
              as="textarea"
              rows={4}
              value={comment}
              onChange={(e: any) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length <= 200) {
                  setComment(e.target.value);
                } else {
                  const trimmed = words.slice(0, 200).join(" ");
                  setComment(trimmed);
                }
              }}
            />
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Send Clarification
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UnitClarificationModal;
