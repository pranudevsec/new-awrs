import Modal from "react-bootstrap/Modal";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../reduxToolkit";
import { updateClarification } from "../reduxToolkit/services/clarification/clarificationService";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  clarificationId: number; // ✅ Accept ID as a prop
  isRefreshData: boolean;
  setIsRefreshData: React.Dispatch<React.SetStateAction<boolean>>; 
}

const GiveClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  clarificationId,
  setIsRefreshData,
  isRefreshData
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [clarification, setClarification] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clarification.trim()) return;

    await dispatch(
      updateClarification({
        id: clarificationId,
        clarification: clarification, // Assuming you're sending status here. Adjust field name if needed.
      })
    );
    setIsRefreshData(!isRefreshData)
    handleClose();
    setClarification("");
  };

  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Create clarification</h4>
        <button className="close-btn bg-transparent border-0" onClick={handleClose}>
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <FormInput
              name="clarification"
              placeholder="Maximum 200 Words...."
              type="text"
              as="textarea"
              rows={8}
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GiveClarificationModal;
